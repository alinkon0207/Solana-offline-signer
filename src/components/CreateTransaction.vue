<script>
import Button from './reusable/Button.vue';
import FormInput from './reusable/FormInput.vue';
import QrcodeVue from 'qrcode.vue';

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import * as web3 from '@solana/web3.js';

import nacl from 'tweetnacl';
import * as bip39 from 'bip39';
import * as bs58 from "bs58";
import { derivePath } from 'ed25519-hd-key';

export default {
	components: {
		Button,
		FormInput,
		QrcodeVue,
	},
	data: () => {
		return {
			picked: '1',
			recentBlockhash: localStorage.getItem('RecentBlockhash') == undefined ? '' : localStorage.getItem('RecentBlockhash'),
			nonceAccountPublicKey: localStorage.getItem('NonceAccount-PublicKey') == undefined ? '' : localStorage.getItem('NonceAccount-PublicKey'),
			nonceAccountSecretKey: localStorage.getItem('NonceAccount-SecretKey') == undefined ? '' : localStorage.getItem('NonceAccount-SecretKey'),
			nonceAccountAuthPublicKey: localStorage.getItem('NonceAccountAuth-PublicKey') == undefined ? '' : localStorage.getItem('NonceAccountAuth-PublicKey'),
			nonceAccountAuthSecretKey: localStorage.getItem('NonceAccountAuth-SecretKey') == undefined ? '' : localStorage.getItem('NonceAccountAuth-SecretKey'),
			destinationAddress: localStorage.getItem('DestinationAddress') == undefined ? '' : localStorage.getItem('DestinationAddress'),
			amount: localStorage.getItem('Amount') == undefined ? '' : localStorage.getItem('Amount'),
			mnemonic: 'another claw veteran ancient early manual tip eternal horn stereo hole apple',
			sourceAddress: null,
			URLtoBroadcast: localStorage.getItem('EndPointUrl') == undefined ? '' : localStorage.getItem('EndPointUrl'),
			IsCreated: false,
			signedTx: '',
		}
	},
	methods: {
		setDestinationAddress(event) {
			this.destinationAddress = event.target.value;

			localStorage.setItem('DestinationAddress', this.destinationAddress);
		},
		setAmount(event) {
			this.amount = event.target.value;

			localStorage.setItem('Amount', this.amount);
		},
		setMnemonic(event) {
			this.mnemonic = event.target.value;

			this.getSourceAddressFromMnemonic();
		},
		async getSourceAddressFromMnemonic() {
			// Add web3
			try {
				const seed = bip39.mnemonicToSeedSync(this.mnemonic, "");
				const path = `m/44'/501'/0'/0'`;
				const keypair = web3.Keypair.fromSeed(derivePath(path, seed.toString("hex")).key);

				this.sourceAddress = keypair;
			} catch (e) {
				console.log(e);
			}
		},
		async createTransaction() {
			// Add web3
			try {
				const feePayer = web3.Keypair.generate();

				if (this.picked == '1') {
					// 1. Create Transaction
					let tx = new web3.Transaction().add(
						web3.SystemProgram.transfer({
							fromPubkey: this.sourceAddress.publicKey,
							toPubkey: new web3.PublicKey(this.destinationAddress),
							lamports: this.amount,
						})
					);
					tx.recentBlockhash = this.recentBlockhash;
					tx.feePayer = feePayer.publicKey;
					let realDataNeedToSign = tx.serializeMessage(); // the real data singer need to sign.

					// 2. Sign Transaction
					let feePayerSignature = nacl.sign.detached(realDataNeedToSign, feePayer.secretKey);
					let sourceSignature = nacl.sign.detached(realDataNeedToSign, this.sourceAddress.secretKey);

					// 3. Recover Transaction
					let verifyFeePayerSignatureResult = nacl.sign.detached.verify(
						realDataNeedToSign,
						feePayerSignature,
						feePayer.publicKey.toBytes() // you should use the raw pubkey (32 bytes) to verify
					);
					console.log(`verify feePayer signature: ${verifyFeePayerSignatureResult}`);

					let recoverTx = web3.Transaction.populate(web3.Message.from(realDataNeedToSign), [
						bs58.encode(feePayerSignature),
						bs58.encode(sourceSignature),
					]);

					// 4. Convert to base64 code
					this.IsCreated = true;
					this.signedTx = recoverTx.serialize().toString('base64');

					localStorage.setItem('SignedTx', this.signedTx);
				} else {
					console.log(this.nonceAccountAuthSecretKey);

					const nonceAccountAuth = web3.Keypair.fromSecretKey(
						bs58.decode(
							this.nonceAccountAuthSecretKey
						)
					);

					const connection = new web3.Connection(this.URLtoBroadcast);

					const nonceAccountPubkey = new web3.PublicKey(
						this.nonceAccountPublicKey
					);
					let nonceAccountInfo = await connection.getAccountInfo(nonceAccountPubkey);
					let nonceAccount = web3.NonceAccount.fromAccountData(nonceAccountInfo.data);

					let tx = new web3.Transaction().add(
						// nonce advance must be the first insturction
						web3.SystemProgram.nonceAdvance({
							noncePubkey: nonceAccountPubkey,
							authorizedPubkey: nonceAccountAuth.publicKey,
						}),
						// after that, you do what you really want to do, here we append a transfer instruction as an example.
						web3.SystemProgram.transfer({
							fromPubkey: feePayer.publicKey,
							toPubkey: nonceAccountAuth.publicKey,
							lamports: this.amount,
						})
					);
					// assign `nonce` as recentBlockhash
					tx.recentBlockhash = nonceAccount.nonce;
					tx.feePayer = feePayer.publicKey;
					tx.sign(
						feePayer,
						nonceAccountAuth
					); /* fee payer + nonce account authority + ... */

					// Convert to base64 code
					this.IsCreated = true;
					this.signedTx = tx.serialize().toString('base64');

					localStorage.setItem('SignedTx', this.signedTx);
				}
			} catch (e) {
				console.log(e);
			}
		},
		onFileChange(event) {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader()
				reader.onload = () => {
					this.mnemonic = reader.result;

					this.getSourceAddressFromMnemonic();
				}
				reader.readAsText(file)
			}
		}
	},
	mounted() {
		this.getSourceAddressFromMnemonic();
	}
};
</script>

<template>
	<div class="w-full">
		<div class="leading-loose p-7 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left">
			<div class="flex items-center justify-center">
				<input v-model="picked" type="radio" name="check-1" value="1" />
				<label class="ml-2 text-white" for="check-1">Recent Blockhash</label>

				<input v-model="picked" type="radio" name="check-2" value="2" class="ml-8" />
				<label class="ml-2 text-white" for="check-2">Nonce Account</label>
			</div>

			<FormInput label="Recent Blockhash" inputIdentifier="Recent Blockhash" :val="recentBlockhash"
				placeholder="Unknown" readonly :hidden="picked != '1'" />

			<FormInput label="Nonce Account" inputIdentifier="Nonce Account" :val="nonceAccountPublicKey"
				placeholder="Unknown" readonly :hidden="picked != '2'" />

			<FormInput label="Destination Address" inputIdentifier="Destination Address" :val="destinationAddress"
				placeholder="Unknown" @input="event => setDestinationAddress(event)" />
			<FormInput label="Amount (Lamports)" inputIdentifier="" :val="amount" placeholder="Type the amount"
				@input="event => setAmount(event)" />
			<div class="text-white flex justify-end mr-2">
				{{ amount / (10 ** 9) }} SOL
			</div>
			<div>
				<label class="block mb-2 text-lg text-primary-dark dark:text-primary-light">Mnemonic</label>
				<input
					class="text-white border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm"
					type="file" @change="onFileChange" ref="file">
			</div>
			<!-- <FormInput label="Mnemonic" inputIdentifier="Mnemonic" :val="mnemonic" placeholder="Type the mnemonic"
				@input="event => setMnemonic(event)" /> -->
			<FormInput label="Source Address" inputIdentifier="Source Address"
				:val="sourceAddress != null ? sourceAddress.publicKey : ''" placeholder="Type the Source Address" />
			<FormInput label="URL to broadcast" inputIdentifier="URL to broadcast" :val="URLtoBroadcast" />

			<div class="flex justify-center my-4">
				<Button title="Create Transaction"
					class="px-4 py-2.5 text-white tracking-wider bg-indigo-500 hover:bg-indigo-600 focus:ring-1 focus:ring-indigo-900 rounded-lg duration-500"
					type="button" aria-label="Get Recent Blockhash" @click="createTransaction" />
			</div>

			<div class="text-white" v-if="IsCreated == true">
				<div style="border-bottom: 1px dotted gray"></div>
				<div class="text-white text-lg mt-2">
					<h1>Signed Transaction:</h1>
				</div>

				<div style="word-break: break-all;">
					{{ signedTx }}
				</div>
				<div class="flex justify-center">
					<qrcode-vue :value="signedTx" size="256"></qrcode-vue>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped></style>
