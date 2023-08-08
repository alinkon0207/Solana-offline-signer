<script>
import Button from './reusable/Button.vue';
import FormInput from './reusable/FormInput.vue';

import * as web3 from '@solana/web3.js';

export default {
	components: {
		Button,
		FormInput,
	},
	data: () => {
		return {
			endpointUrl: localStorage.getItem('EndPointUrl') == undefined ? '' : localStorage.getItem('EndPointUrl'),
			IsRequested: false,
			recentBlockhash: '',
			nodes: [
				{
					url: 'https://api.devnet.solana.com'	// testnet
				},
				{
					url: 'https://api.mainnet-beta.solana.com'	// mainnet
				},
				{
					url: 'https://api.metaplex.solana.com'	// other public url of mainnet
				},
				// {
				// 	url: 'https://solana-devnet.g.alchemy.com/v2/iq-vSBJDLt7-8Gphy_NqUHShzguFb5Kz'	// devnet url from Alchemy
				// },
				{
					url: 'https://solana-mainnet.g.alchemy.com/v2/j_0irTskpyfvy2WtK09VvhamD6IQWQjO' // mainnet url from Alchemy
				},
				{
					url: 'https://empty-damp-smoke.solana-mainnet.quiknode.pro/efd7051f8f55e9678d2a95e536c32e41897d8b54'	// quicknode - fail
				}
			]
		}
	},
	methods: {
		setNode(url) {
			this.endpointUrl = url;
			localStorage.setItem('EndPointUrl', this.endpointUrl);
		},
		async getRecentBlockhash() {
			// Add web3
			try {
				const connection = new web3.Connection(this.endpointUrl);

				connection.getRecentBlockhash().then((recentBlockhash) => {
					this.IsRequested = true;
					this.recentBlockhash = recentBlockhash.blockhash;
					localStorage.setItem('RecentBlockhash', this.recentBlockhash);
				}).catch(e => {
					console.log(e);
				});
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
			<FormInput label="Solana Endpoint URL" inputIdentifier="URL" :val="endpointUrl" readonly />
			<div class="text-white">
				No trailing slash "/". eg: http://localhost:8899
			</div>
			<div class="text-white mt-4">
				Known Nodes (click to set):
			</div>
			<div>
				<ul>
					<li class="text-[#a0a0a0] cursor-pointer hover:text-[#8060c0]" v-for="node in nodes" :key="node.url"
						@click="setNode(node.url)">
						{{ node.url }}
					</li>
				</ul>
			</div>
			<div class="text-white my-4">
				Explorer: <a class="text-[#009080] hover:text-[#8060c0]" href="https://solscan.io/"
					target="_blank">https://solscan.io/</a>
			</div>

			<div class="flex justify-center">
				<Button title="Get Recent Blockhash"
					class="px-4 py-2.5 text-white tracking-wider bg-indigo-500 hover:bg-indigo-600 focus:ring-1 focus:ring-indigo-900 rounded-lg duration-500"
					type="button" aria-label="Get Recent Blockhash" @click="getRecentBlockhash" />
			</div>
			<div class="text-white">
				Get Recent Blockhash result:
				<div v-if="IsRequested == true">
					{{ recentBlockhash }}
				</div>
				<div v-else>
					None
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped></style>
