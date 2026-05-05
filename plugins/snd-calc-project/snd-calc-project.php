<?php
/**
 * Plugin Name:       Калькулятор проектов
 * Description:       Вдохновлено посчитайте-пожалуйста.рф
 * Version:           0.1.0
 * Requires at least: 6.8
 * Requires PHP:      7.4
 * Author:            Филиппов Павел
 * Author URI:        https://philippovpavel.ru
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       snd-calc-project
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function snd_create_block_init() {
	wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
}
add_action( 'init', 'snd_create_block_init' );

function snd_register_custom_post_type() {
	$args = array(
		'label' => 'Калькуляторы проектов',
		'labels' => array(
			'name'                     => 'Калькуляторы проектов',
			'singular_name'            => 'Калькулятор проекта',
			'add_new'                  => 'Добавить калькулятор',
			'add_new_item'             => 'Добавить новый калькулятор',
			'edit_item'                => 'Изменить калькулятор',
			'new_item'                 => 'Новый калькулятор',
			'view_item'                => 'Просмотр калькулятора',
			'search_items'             => 'Найти калькулятор',
			'not_found'                => 'Калькуляторов не найдено',
			'not_found_in_trash'       => 'В корзине нет калькуляторов',
			'parent_item_colon'        => 'Родительский калькулятор',
			'all_items'                => 'Все калькуляторы',
			'archives'                 => 'Архивы калькуляторов',
			'menu_name'                => 'Калькуляторы',
			'name_admin_bar'           => 'Калькулятор',
			'view_items'               => 'Просмотр калькуляторов',
			'attributes'               => 'Свойства калькулятора',
			'insert_into_item'         => 'Вставить в калькулятор',
			'uploaded_to_this_item'    => 'Загружено для этого калькулятора',
			'featured_image'           => 'Изображение калькулятора',
			'set_featured_image'       => 'Установить изображение калькулятора',
			'remove_featured_image'    => 'Удалить изображение калькулятора',
			'use_featured_image'       => 'Использовать как изображение калькулятора',
			'item_updated'             => 'Калькулятор обновлён.',
			'item_published'           => 'Калькулятор добавлен.',
			'item_published_privately' => 'Калькулятор добавлен приватно.',
			'item_reverted_to_draft'   => 'Калькулятор сохранён как черновик.',
			'item_scheduled'           => 'Публикация калькулятора запланирована.',
		),
		'public' => false,
		'menu_icon' => 'dashicons-calculator',
		'show_ui' => true,
		'show_in_rest' => true,
		'supports' => ['title', 'editor', 'custom-fields']
	);

	register_post_type( 'snd_calc_projects', $args );
}
add_action( 'init', 'snd_register_custom_post_type' );

function snd_register_post_type_args($args, $post_type) {
	if ($post_type === 'snd_calc_projects') {
		$args['template'] = [
			['snd/calc-project']
		];
		$args['template_lock'] = true;
	}

	return $args;
}
add_filter( 'register_post_type_args', 'snd_register_post_type_args', 10, 2 );

function snd_register_calc_projects_meta() {
	register_post_meta('snd_calc_projects', 'total_price', [
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'auth_callback' => function () {
			return current_user_can('edit_posts');
		},
	]);
}
add_action('init', 'snd_register_calc_projects_meta');

function snd_calc_projects_meta_columns($columns)
{
$new_columns = [];

foreach ($columns as $key => $value) {
	$new_columns[$key] = $value;

	if ($key === 'title') {
		$new_columns['total_price'] = 'Итоговая цена, ₽';
	}
}
	return $new_columns;
}
add_filter('manage_snd_calc_projects_posts_columns', 'snd_calc_projects_meta_columns');

function snd_calc_projects_meta_columns_content($column, $post_id)
{
	if ($column == 'total_price') {
		$total_price = esc_attr(get_post_meta($post_id, 'total_price', true));
		echo $total_price ?: '0';
	}
}
add_action('manage_snd_calc_projects_posts_custom_column', 'snd_calc_projects_meta_columns_content', 10, 2);

function snd_calc_projects_meta_sortable_columns($columns)
{
  $columns['total_price'] = 'total_price';
  return $columns;
}
add_filter('manage_edit-snd_calc_projects_sortable_columns', 'snd_calc_projects_meta_sortable_columns');