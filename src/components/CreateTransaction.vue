<script>
import Button from './reusable/Button.vue';
import FormInput from './reusable/FormInput.vue';
import QrcodeVue from 'qrcode.vue';

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
			recentBlockhash: localStorage.getItem('RecentBlockhash') == undefined ? '' : localStorage.getItem('RecentBlockhash'),
			nonceAccountAddress: localStorage.getItem('NonceAccountAddress') == undefined ? '' : localStorage.getItem('NonceAccountAddress'),
			accountNonce: localStorage.getItem('NextAccountNonce') == undefined ? '' : localStorage.getItem('NextAccountNonce'),
			destinationAddress: localStorage.getItem('DestinationAddress') == undefined ? '' : localStorage.getItem('DestinationAddress'),
			amount: localStorage.getItem('Amount') == undefined ? '' : localStorage.getItem('Amount'),
			mnemonic: '',
			sourceAddress: null,
			signedTx: '',
			option: 'nonce',
		}
	},
	methods: {
		setRecentBlockhash(event) {
			this.recentBlockhash = event.target.value;
		},
		setNonceAccountAddress(event) {
			this.nonceAccountAddress = event.target.value;
			localStorage.setItem('NonceAccountAddress', this.nonceAccountAddress);
		},
		setAccountNonce(event) {
			this.accountNonce = event.target.value;
			localStorage.setItem('NextAccountNonce', this.accountNonce);
		},
		setDestinationAddress(event) {
			this.destinationAddress = event.target.value;
			localStorage.setItem('DestinationAddress', this.destinationAddress);
		},
		setAmount(event) {
			this.amount = event.target.value;
			localStorage.setItem('Amount', this.amount);
		},
		async getSourceAddressFromMnemonic() {
			try {
				const seed = bip39.mnemonicToSeedSync(this.mnemonic, "");
				const keypair = web3.Keypair.fromSeed(Uint8Array.from(seed.slice(0, 32)))
				this.sourceAddress = keypair;
			} catch (e) {
				console.log(e);
			}
		},
		async createTransaction() {
			try {

				// 1. Create Transaction
				const tx = new web3.Transaction();
				
				if (this.option === 'nonce') {
					const noncePk = new web3.PublicKey(this.nonceAccountAddress);
					// make a nonce advance instruction
					tx.add(web3.SystemProgram.nonceAdvance({
						authorizedPubkey: this.sourceAddress.publicKey,
						noncePubkey: noncePk
					}));
					// use the `nonce` which stored in the nonce acocunt as a recent blockhash
					tx.recentBlockhash = this.accountNonce;
					console.log('Setting nonce public key: ' + noncePk.toString())
					console.log('Setting nonce public key b58: ' + noncePk.toBase58())
					console.log('Setting nonce to: ' + this.accountNonce)
				} else {
					tx.recentBlockhash = this.recentBlockhash;
					console.log('Using Recent Blockhash: ' + this.recentBlockhash)
				}

				tx.add(web3.SystemProgram.transfer({
					fromPubkey: this.sourceAddress.publicKey,
					toPubkey: new web3.PublicKey(this.destinationAddress),
					lamports: this.amount,
				}));

				tx.feePayer = this.sourceAddress.publicKey;
				tx.sign(this.sourceAddress);

				this.signedTx = tx.serialize().toString('base64');

				localStorage.setItem('SignedTx', this.signedTx);
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
};
</script>

<template>
	<div class="w-full">
		<div class="leading-loose p-7 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left">
			<div class="text-white">
				<label>
					<input type="radio" value="hash" v-model="option" /> Recent Hash
				</label>
				<label>
					<input type="radio" value="nonce" v-model="option" /> Nonce
				</label>
			</div>
			<FormInput label="Recent Blockhash" inputIdentifier="Recent Blockhash" :val="recentBlockhash"
				v-if="option === 'hash'" placeholder="Unknown" @input="event => setRecentBlockhash(event)" />
			<FormInput label="Nonce Account Address" inputIdentifier="Nonce Account Address" :val="nonceAccountAddress"
				v-if="option === 'nonce'" placeholder="Unknown" @input="event => setNonceAccountAddress(event)" />
			<FormInput label="Account Nonce" inputIdentifier="Account Nonce" :val="accountNonce" v-if="option === 'nonce'"
				placeholder="Unknown" @input="event => setAccountNonce(event)" />

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
			<FormInput label="Source Address" inputIdentifier="Source Address"
				:val="sourceAddress != null ? sourceAddress.publicKey : ''" placeholder="Type the Source Address" />

			<div class="flex justify-center my-4">
				<Button title="Create Transaction"
					class="px-4 py-2.5 text-white tracking-wider bg-indigo-500 hover:bg-indigo-600 focus:ring-1 focus:ring-indigo-900 rounded-lg duration-500"
					type="button" aria-label="Get Recent Blockhash" @click="createTransaction" />
			</div>

			<div class="text-white">
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
