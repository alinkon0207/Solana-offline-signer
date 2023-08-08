<script>
import Button from './reusable/Button.vue';
import FormInput from './reusable/FormInput.vue';

import * as web3 from '@solana/web3.js';

import * as bs58 from "bs58";

export default {
	components: {
		Button,
		FormInput,
	},
	data: () => {
		return {
			URLtoBroadcast: localStorage.getItem('EndPointUrl') == undefined ? '' : localStorage.getItem('EndPointUrl'),
			IsRequested: false,
			nonceAccount: null,
		}
	},
	methods: {
		async createNonceAccount() {
			// Add web3
			try {
				const connection = new web3.Connection(this.URLtoBroadcast);

				const NONCE_ACCOUNT_LENGTH = 44;

				const feePayer = web3.Keypair.generate();

				const nonceAccountAuth = web3.Keypair.generate();

				this.nonceAccount = web3.Keypair.generate();
				console.log(`nonce account: ${this.nonceAccount.publicKey.toBase58()}`);

				let tx = new web3.Transaction().add(
					// create nonce account
					web3.SystemProgram.createAccount({
						fromPubkey: feePayer.publicKey,
						newAccountPubkey: this.nonceAccount.publicKey,
						lamports: await connection.getMinimumBalanceForRentExemption(
							NONCE_ACCOUNT_LENGTH
						),
						space: NONCE_ACCOUNT_LENGTH,
						programId: web3.SystemProgram.programId,
					}),
					// init nonce account
					web3.SystemProgram.nonceInitialize({
						noncePubkey: this.nonceAccount.publicKey, // nonce account pubkey
						authorizedPubkey: this.nonceAccount.publicKey, // nonce account authority (for advance and close)
					})
				);

				console.log(
					`txhash: ${await connection.sendTransaction(tx, [feePayer, this.nonceAccount])}`
				);

				// Save Info
				this.IsRequested = true;

				localStorage.setItem('NonceAccount-PublicKey', this.nonceAccount.publicKey.toBase58());
				localStorage.setItem('NonceAccount-SecretKey', bs58.encode(this.nonceAccount.secretKey));
				localStorage.setItem('NonceAccountAuth-PublicKey', nonceAccountAuth.publicKey.toBase58());
				localStorage.setItem('NonceAccountAuth-SecretKey', bs58.encode(nonceAccountAuth.secretKey));
			} catch (e) {
				console.log(e);
			}
		}
	},
};
</script>

<template>
	<div class="w-full">
		<div class="leading-loose p-7 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left">
			<FormInput label="URL to broadcast" inputIdentifier="URL to broadcast" :val="URLtoBroadcast" readonly />

			<div class="flex justify-center my-4">
				<Button title="Create Nonce Account"
					class="px-4 py-2.5 text-white tracking-wider bg-indigo-500 hover:bg-indigo-600 focus:ring-1 focus:ring-indigo-900 rounded-lg duration-500"
					type="button" aria-label="Create Nonce Account" @click="createNonceAccount" />
			</div>
			<div class="text-white">
				Nonce Account:
				<div v-if="IsRequested == true">
					{{ nonceAccount.publicKey.toBase58() }}
				</div>
				<div v-else>
					None
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped></style>
