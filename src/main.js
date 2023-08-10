import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/css/app.css';

createApp(App).use(router).mount('#app')


// Check what is the active theme and change theme when user clicks on the theme button in header.
document.querySelector('body').classList.add('bg-primary-dark');