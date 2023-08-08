<script>
export default {
	props: {
		label: {
			type: String,
			default: '',
		},
		inputIdentifier: {
			type: String,
			default: '',
		},
		val: {
			type: [String, Number],
			default: '',
		},
		inputType: {
			type: String,
			default: 'text',
		},
	}
};
</script>

<template>
	<div class="flex items-center">
		<input type="radio" id="check-1" name="check-1" value="label" />
		<span class="ml-2 text-white">Recent Blockhash</span>

		<input type="radio" id="check-2" name="check-2" value="label" class="ml-8" />
		<span class="ml-2 text-white">Nonce Account</span>
	</div>
</template>

<style lang="scss" scoped></style>
