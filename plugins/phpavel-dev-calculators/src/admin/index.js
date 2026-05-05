import { render } from '@wordpress/element';
import './style.scss';
import EditPage from './pages/EditPage';
import ListPage from './pages/ListPage';
import { config } from './shared';

function AppRouter() {
	return config.currentPage === 'phpavel-dev-calculators-edit' ? <EditPage /> : <ListPage />;
}

render( <AppRouter />, document.getElementById( 'phpavel-dev-calculators-admin-app' ) );
