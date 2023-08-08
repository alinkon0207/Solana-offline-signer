import { ref } from '@vue/reactivity';

export default function useThemeSwitcher() {
	const currentTheme = ref('dark');

	function toggleTheme() {
		setDarkTheme();
	}

	// Dark Theme Function
	function setDarkTheme() {
		currentTheme.value = 'dark';

		process.isClient && localStorage.setItem('theme', 'dark');
	}

	return {
		toggleTheme,
	};
}
