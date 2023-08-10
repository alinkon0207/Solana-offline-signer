<script>
import Button from './reusable/Button.vue';
import FormInput from './reusable/FormInput.vue';
import QrcodeVue from 'qrcode.vue';
import * as web3 from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import 'vue3-toastify/dist/index.css';

export default {
	components: {
		Button,
		FormInput,
		QrcodeVue,
	},
	data: () => {
		return {
			recentBlockhash: localStorage.getItem('RecentBlockhash') == undefined ? '' : localStorage.getItem('RecentBlockhash'),
			minFeeExemptAmount: localStorage.getItem('MinFeeExemptAmount') == undefined ? 1500000 : localStorage.getItem('MinFeeExemptAmount'),
			destinationAddress: localStorage.getItem('DestinationAddress') == undefined ? '' : localStorage.getItem('DestinationAddress'),
			mnemonic: null, //Seed for the account creating the nonce account
			nonceMnemonic: null, //Seed for the nonce account
			sourceAccount: null,
			nonceAccount: null,
			signedTx: '',
			nonceAccountDerivationPath: "m/44'/501'/0'/2'",
		}
	},
	methods: {
		setRecentBlockhash(event) {
			this.recentBlockhash = event.target.value;
		},
		setAmount(event) {
			this.minFeeExemptAmount = event.target.value;
			localStorage.setItem('MinFeeExemptAmount', this.minFeeExemptAmount);
		},
		async getSourceAddressFromMnemonic() {
			try {
				const seed = bip39.mnemonicToSeedSync(this.mnemonic, "");
				const keypair = web3.Keypair.fromSeed(Uint8Array.from(seed.slice(0, 32)));
				this.sourceAccount = keypair;
			} catch (e) {
				console.log(e);
			}
		},
		async getNonceAddressFromMnemonic() {
			try {
				if(!this.nonceMnemonic){
					return; //We should not generate unless there is a selected seed/mnemonic file, otherwise may accidentally loose private key 
				}
				const seed = bip39.mnemonicToSeedSync(this.nonceMnemonic, "");
				const keypair = web3.Keypair.fromSeed(derivePath(this.nonceAccountDerivationPath, seed.toString("hex")).key);
				this.nonceAccount = keypair;

				localStorage.setItem('NonceAccountAddress', this.nonceAccount.publicKey);
			} catch (e) {
				console.log(e);
			}
		},
		async createNonceAccount() {
			try {
				console.log(`nonce account: ${this.nonceAccount.publicKey.toBase58()}`);
				console.log(`source account: ${this.sourceAccount.publicKey.toBase58()}`);

				let tx = new web3.Transaction().add(
					// create nonce account
					web3.SystemProgram.createAccount({
						fromPubkey: this.sourceAccount.publicKey,
						newAccountPubkey: this.nonceAccount.publicKey,
						lamports: this.minFeeExemptAmount,
						space: web3.NONCE_ACCOUNT_LENGTH,
						programId: web3.SystemProgram.programId,
					}),
					// init nonce account
					web3.SystemProgram.nonceInitialize({
						noncePubkey: this.nonceAccount.publicKey, // nonce account pubkey
						authorizedPubkey: this.sourceAccount.publicKey, // nonce account authority (for advance and close)
					})
				);
				tx.recentBlockhash = this.recentBlockhash;
				tx.feePayer = this.sourceAccount.publicKey;

				// sign the transaction with both the nonce keypair and the authority keypair
				tx.sign(this.nonceAccount, this.sourceAccount);

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
			}else {
				console.log('No File Selecrted')
			}
		},
		onNonceFileChange(event) {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader()
				reader.onload = () => {
					this.nonceMnemonic = reader.result;
					this.getNonceAddressFromMnemonic();
				}
				reader.readAsText(file)
			} else {
				console.log('No File Selecrted')
			}

		},
		setDerivationPath(value) {
			this.nonceAccountDerivationPath = value;
			console.log('new Derivation Path: ' + value);
			this.getNonceAddressFromMnemonic();
		}
	},
};
</script>

<template>
	<div class="w-full">
		<div class="leading-loose p-7 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left">

			<FormInput label="Recent Blockhash" inputIdentifier="Recent Blockhash" placeholder="Recent Blockhash"
				:val="recentBlockhash" @input="setRecentBlockhash" />

			<FormInput label="Amount to seen Nonce account with (Lamports)" inputIdentifier="" :val="minFeeExemptAmount" placeholder="Type the amount"
				@input="event => setAmount(event)" />
			<div class="text-white flex justify-end mr-2">
				{{ minFeeExemptAmount / (10 ** 9) }} SOL
			</div>

			<div>
				<label class="block mb-2 text-lg text-primary-dark dark:text-primary-light">Mnemonic/Seed (Nonce
					Authority)</label>
				<input
					class="text-white border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm"
					type="file" @change="onFileChange" ref="file">
			</div>
			<FormInput label="Source Address" inputIdentifier="Source Address"
				:val="sourceAccount != null ? sourceAccount.publicKey : ''" placeholder="Type the Source Address" />

			<!-- New nonce Account Seed-->
			<div class="mt-10">
				<label class="block mb-2 text-lg text-primary-dark dark:text-primary-light">Mnemonic/Seed (New Nonce
					Account)</label>
				<input
					class="text-white border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm"
					type="file" @change="onNonceFileChange" ref="file">
			</div>
			<!-- New Nonce Seed Address Derivation Path-->
			<label class="block mb-2 text-lg text-primary-dark dark:text-primary-light">New Nonce Seed - Address Derivation
				Path</label>
			<FormInput label="Nonce Account Derivation Path" inputIdentifier="Nonce Account Derivation Path"
				:val="nonceAccountDerivationPath" placeholder="m/44'/501'/0'/2'" @input="event => setDerivationPath(event.target.value)" />
			<FormInput label="Nonce Address" inputIdentifier="Nonce Address"
				:val="nonceAccount != null ? nonceAccount.publicKey : ''" placeholder="Nonce Address" />


			<div class="flex justify-center my-4">
				<Button title="Create Nonce Account Transaction"
					class="px-4 py-2.5 text-white tracking-wider bg-indigo-500 hover:bg-indigo-600 focus:ring-1 focus:ring-indigo-900 rounded-lg duration-500"
					type="button" aria-label="Create Nonce Account" @click="createNonceAccount" />
			</div>

			<!-- Raw Transaction Output-->
			<div style="word-break: break-all;" class="text-white">
				{{ signedTx }}
			</div>
			<!-- QR Code for Create nonce TX-->
			<div class="flex justify-center">
				<qrcode-vue :value="signedTx" size="256"></qrcode-vue>
			</div>

		</div>
	</div>
</template>

<style lang="scss" scoped></style>
