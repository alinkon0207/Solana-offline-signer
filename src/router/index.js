import { createRouter, createWebHashHistory } from 'vue-router'

import CreateTx from '../views/CreateTx.vue'
import Broadcast from '../views/Broadcast.vue'
import Settings from '../views/Settings.vue'
import NonceAccount from '../views/NonceAccount.vue'


const routes = [
  {
    path: '/',
    name: 'home',
    component:  CreateTx
  },
  {
    path: '/broadcast',
    name: 'Broadcast',
    component: Broadcast
  },
	{
		path: '/settings',
		name: 'Settings',
		component: Settings
	},
	{
		path: '/nonce',
		name: 'Create Nonce Account',
		component: NonceAccount
	},
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

