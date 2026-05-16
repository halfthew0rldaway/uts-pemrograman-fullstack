export interface INavigationRoute {
  name: string
  displayName: string
  meta: { icon: string }
  children?: INavigationRoute[]
}

export default {
  root: {
    name: '/',
    displayName: 'navigationRoutes.home',
  },
  routes: [
    {
      name: 'dashboard',
      displayName: 'menu.dashboard',
      meta: { icon: 'vuestic-iconset-dashboard' },
    },
    {
      name: 'employees',
      displayName: 'menu.employees',
      meta: { icon: 'mso-badge' },
    },
    {
      name: 'users',
      displayName: 'menu.users',
      meta: { icon: 'mso-manage_accounts' },
    },
    {
      name: 'logs',
      displayName: 'menu.logs',
      meta: { icon: 'mso-history' },
    },
    {
      name: 'profile',
      displayName: 'menu.profile',
      meta: { icon: 'mso-account_circle' },
    },
    {
      name: 'settings',
      displayName: 'menu.about',
      meta: { icon: 'mso-info' },
    },
  ] as INavigationRoute[],
}
