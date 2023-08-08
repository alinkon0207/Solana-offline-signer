<script>
import ThemeSwitcher from '../ThemeSwitcher';
import AppHeaderLinks from './AppHeaderLinks.vue';

export default {
	components: {
		ThemeSwitcher,
		AppHeaderLinks,
	},
	data() {
		return {
			isOpen: false,
			theme: '',
			modal: false,
		};
	},

	created() {
		this.theme = 'dark';
	},
	mounted() {
		this.theme = 'dark';
	},
	methods: {
		updateTheme(theme) {
			this.theme = theme;
		},
	},
};
</script>

<template>
	<nav id="nav" class="sm:container sm:mx-auto">

		<div class="text-center mt-4">
			<p class="font-general-semibold text-2xl sm:text-5xl font-semibold mb-2 text-ternary-dark dark:text-ternary-light">
				Solana Signer
			</p>
		</div>

		<!-- Header start -->
		<div class="z-10 max-w-screen-lg xl:max-w-screen-xl block sm:flex sm:justify-between sm:items-center my-6">
			<!-- Header menu links and small screen hamburger menu -->
			<div class="flex justify-between items-center px-4 sm:px-0">
				<!-- Theme switcher small screen -->
				<theme-switcher :theme="theme" @themeChanged="updateTheme"
					class="block sm:hidden bg-ternary-light dark:bg-ternary-dark hover:bg-hover-light dark:hover:bg-hover-dark hover:shadow-sm px-2.5 py-2 rounded-lg" />
			</div>

			<!-- Header links -->
			<AppHeaderLinks :showModal="showModal" :isOpen="isOpen" />

			<!-- Header right section buttons -->
			<div class="hidden sm:flex justify-between items-center flex-col md:flex-row">
				<!-- Hire me button -->
				<div class="hidden md:block">
				</div>
			</div>
		</div>
	</nav>
</template>

<style scoped></style>
