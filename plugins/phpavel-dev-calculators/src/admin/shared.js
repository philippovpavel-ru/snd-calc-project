import apiFetch from '@wordpress/api-fetch';
import { getLocaleData } from '@wordpress/i18n';

export const config = window.phpavelDevCalculatorsAdmin || {};

apiFetch.use( apiFetch.createNonceMiddleware( config.nonce ) );

export const restFetch = apiFetch;

export const apiPath = ( path ) => `/${ config.restNamespace }${ path }`;

function getDefaultCurrency() {
	const locale = String( config.siteLocale || '' ).toLowerCase();
	return locale.startsWith( 'ru' ) ? '₽' : '$';
}

export function createEmptyCalculator() {
	return {
		id: null,
		title: '',
		status: 'draft',
		settings: {
			main: { tax: 6, hourlyRate: 1500, hoursPerDay: 8, currency: getDefaultCurrency() },
			perks: {
				nda: { activate: false, value: 30 },
				marketing: { activate: false, value: 20 },
				quickly: { activate: false, value: 25 },
				distribution: true,
			},
			parther: { activate: false, value: 10 },
		},
		note: '',
		total_price: 0,
		total_days: 0,
		works: [],
		additional_costs: [],
	};
}

export function formatPrice( value ) {
	const num = Number( value || 0 );
	const locale = ( typeof getLocaleData === 'function' && getLocaleData()?.[ '' ]?.lang ) || 'en-US';
	return new Intl.NumberFormat( locale ).format( num );
}

export function normalizeCurrency( currency ) {
	const cur = String( currency || '' ).trim();
	return cur || getDefaultCurrency();
}

export function formatMoney( value, currency ) {
	const cur = normalizeCurrency( currency );
	const isSingleChar = cur.length === 1;
	const spacer = isSingleChar ? '' : ' ';
	return `${ formatPrice( value ) }${ spacer }${ cur }`;
}
