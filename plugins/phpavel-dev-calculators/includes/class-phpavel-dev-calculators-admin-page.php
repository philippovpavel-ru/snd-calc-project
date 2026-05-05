<?php
/**
 * Admin page for calculators UI.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PHPavel_Dev_Calculators_Admin_Page {

	/**
	 * Menu slug.
	 *
	 * @var string
	 */
	const MENU_SLUG = 'phpavel-dev-calculators';
	const EDIT_SLUG = 'phpavel-dev-calculators-edit';

	/**
	 * Hook admin page lifecycle.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_filter( 'admin_title', array( __CLASS__, 'filter_admin_title' ), 10, 2 );
	}

	/**
	 * Register admin menu item after comments.
	 *
	 * @return void
	 */
	public static function register_menu() {
		add_menu_page(
			__( 'Calculators', 'phpavel-dev-calculators' ),
			__( 'Calculators', 'phpavel-dev-calculators' ),
			'edit_posts',
			self::MENU_SLUG,
			array( __CLASS__, 'render_page' ),
			'dashicons-calculator',
			26
		);

		add_submenu_page(
			null,
			__( 'Edit calculator', 'phpavel-dev-calculators' ),
			__( 'Edit calculator', 'phpavel-dev-calculators' ),
			'edit_posts',
			self::EDIT_SLUG,
			array( __CLASS__, 'render_page' )
		);
	}

	/**
	 * Render root element for React app.
	 *
	 * @return void
	 */
	public static function render_page() {
		echo '<div class="wrap"><div id="phpavel-dev-calculators-admin-app"></div></div>';
	}

	/**
	 * Enqueue admin assets only on plugin screen.
	 *
	 * @param string $hook_suffix Admin hook suffix.
	 * @return void
	 */
	public static function enqueue_assets( $hook_suffix ) {
		$allowed_hooks = array(
			'toplevel_page_' . self::MENU_SLUG,
			'admin_page_' . self::EDIT_SLUG,
		);

		if ( ! in_array( $hook_suffix, $allowed_hooks, true ) ) {
			return;
		}

		$asset_file = plugin_dir_path( dirname( __FILE__ ) ) . 'build/index.asset.php';
		$asset_data = file_exists( $asset_file )
			? include $asset_file
			: array(
				'dependencies' => array( 'wp-element', 'wp-components', 'wp-api-fetch' ),
				'version'      => PHPAVEL_DEV_CALCULATORS_VERSION,
			);

		wp_enqueue_style(
			'phpavel-dev-calculators-admin',
			plugin_dir_url( dirname( __FILE__ ) ) . 'build/style-index.css',
			array( 'wp-components' ),
			$asset_data['version']
		);

		if ( wp_style_is( 'wp-dataviews', 'registered' ) ) {
			wp_enqueue_style( 'wp-dataviews' );
		} else {
			$dataviews_css_path = plugin_dir_path( dirname( __FILE__ ) ) . 'node_modules/@wordpress/dataviews/build-style/style.css';
			if ( file_exists( $dataviews_css_path ) ) {
				wp_enqueue_style(
					'phpavel-dev-calculators-dataviews',
					plugin_dir_url( dirname( __FILE__ ) ) . 'node_modules/@wordpress/dataviews/build-style/style.css',
					array( 'wp-components' ),
					$asset_data['version']
				);
			}
		}

		wp_enqueue_script(
			'phpavel-dev-calculators-admin',
			plugin_dir_url( dirname( __FILE__ ) ) . 'build/index.js',
			$asset_data['dependencies'],
			$asset_data['version'],
			true
		);

		wp_localize_script(
			'phpavel-dev-calculators-admin',
			'phpavelDevCalculatorsAdmin',
			array(
				'restNamespace' => 'phpavel-dev-calculators/v1',
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'listPageUrl'   => admin_url( 'admin.php?page=' . self::MENU_SLUG ),
				'editPageUrl'   => admin_url( 'admin.php?page=' . self::EDIT_SLUG ),
				'currentPage'   => isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '',
				'currentId'     => isset( $_GET['id'] ) ? (int) $_GET['id'] : 0,
				'siteLocale'    => determine_locale(),
			)
		);
	}

	/**
	 * Ensure plugin screens always have a non-empty document title.
	 *
	 * @param string $admin_title Full admin document title.
	 * @param string $title       Current screen title part.
	 * @return string
	 */
	public static function filter_admin_title( $admin_title, $title ) {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';

		if ( self::EDIT_SLUG !== $page && self::MENU_SLUG !== $page ) {
			return $admin_title;
		}

		$page_title = self::EDIT_SLUG === $page
			? __( 'Edit calculator', 'phpavel-dev-calculators' )
			: __( 'Calculators', 'phpavel-dev-calculators' );

		$site_name = get_bloginfo( 'name' );

		// In some hidden submenu setups WordPress builds title as " ‹ Site — WordPress".
		if ( preg_match( '/^\s*(?:&lsaquo;|‹)/u', (string) $admin_title ) ) {
			return sprintf( '%1$s %2$s', $page_title, $admin_title );
		}

		return $admin_title;
	}
}
