<?php
/**
 * REST API controller for calculators CRUD.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PHPavel_Dev_Calculators_REST_Controller {

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'phpavel-dev-calculators/v1',
			'/calculators',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'list_calculators' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'create_calculator' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
			)
		);

		register_rest_route(
			'phpavel-dev-calculators/v1',
			'/calculators/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_calculator' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_calculator' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'delete_calculator' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
			)
		);
	}

	/**
	 * Common permission check for content managers/editors.
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_check() {
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'You do not have permission to manage calculators.', 'phpavel-dev-calculators' ),
			array( 'status' => 403 )
		);
	}

	/**
	 * List calculators with optional filters.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response
	 */
	public static function list_calculators( WP_REST_Request $request ) {
		$args = array(
			'limit'  => (int) $request->get_param( 'limit' ),
			'offset' => (int) $request->get_param( 'offset' ),
			'status' => (string) $request->get_param( 'status' ),
			'search' => (string) $request->get_param( 'search' ),
		);

		$items = PHPavel_Dev_Calculators_Calculators_Repository::get_list( $args );

		return rest_ensure_response(
			array(
				'items' => $items,
			)
		);
	}

	/**
	 * Get a single calculator aggregate.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_calculator( WP_REST_Request $request ) {
		$calculator_id = (int) $request['id'];
		$result        = PHPavel_Dev_Calculators_Service::get_calculator( $calculator_id );

		if ( is_wp_error( $result ) ) {
			return self::to_http_error( $result );
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Create a calculator aggregate.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_calculator( WP_REST_Request $request ) {
		$payload = self::get_request_payload( $request );
		$result  = PHPavel_Dev_Calculators_Service::save_calculator( $payload );

		if ( is_wp_error( $result ) ) {
			return self::to_http_error( $result );
		}

		$data = PHPavel_Dev_Calculators_Service::get_calculator( (int) $result );
		if ( is_wp_error( $data ) ) {
			return self::to_http_error( $data );
		}

		return new WP_REST_Response( $data, 201 );
	}

	/**
	 * Update a calculator aggregate.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function update_calculator( WP_REST_Request $request ) {
		$payload       = self::get_request_payload( $request );
		$payload['id'] = (int) $request['id'];

		$result = PHPavel_Dev_Calculators_Service::save_calculator( $payload );

		if ( is_wp_error( $result ) ) {
			return self::to_http_error( $result );
		}

		$data = PHPavel_Dev_Calculators_Service::get_calculator( (int) $result );
		if ( is_wp_error( $data ) ) {
			return self::to_http_error( $data );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Delete calculator aggregate.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function delete_calculator( WP_REST_Request $request ) {
		$calculator_id = (int) $request['id'];
		$deleted       = PHPavel_Dev_Calculators_Service::delete_calculator( $calculator_id );

		if ( ! $deleted ) {
			return new WP_Error(
				'calculator_delete_failed',
				__( 'Failed to delete calculator.', 'phpavel-dev-calculators' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => $calculator_id,
			)
		);
	}

	/**
	 * Parse REST payload as array.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return array
	 */
	private static function get_request_payload( WP_REST_Request $request ) {
		$params = $request->get_json_params();

		if ( is_array( $params ) ) {
			return $params;
		}

		$body_params = $request->get_body_params();
		return is_array( $body_params ) ? $body_params : array();
	}

	/**
	 * Convert service errors to proper HTTP errors.
	 *
	 * @param WP_Error $error Error object.
	 * @return WP_Error
	 */
	private static function to_http_error( WP_Error $error ) {
		$code    = $error->get_error_code();
		$status  = 500;
		$message = $error->get_error_message();

		if ( 'calculator_not_found' === $code ) {
			$status = 404;
		}

		return new WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
