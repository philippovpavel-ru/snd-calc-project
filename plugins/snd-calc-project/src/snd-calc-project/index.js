import { registerBlockType } from '@wordpress/blocks';
import {
	useBlockProps,
	InspectorControls
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	TextareaControl,
	Button,
	Icon,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { copySmall, page, currencyDollar, plus, closeSmall } from '@wordpress/icons';
import { useEffect, useMemo } from '@wordpress/element';

import './editor.scss';
import './style.scss';
import metadata from './block.json';

registerBlockType(metadata.name, {
	edit: ({ attributes, setAttributes }) => {
		const { settings, works, additionalCosts, note } = attributes;

		const totals = useMemo(() => {
			return calculateTotals({ settings, works, additionalCosts });
		}, [settings, works, additionalCosts]);
		const message = buildMessage({ settings, works, totals });

		const { price = 0 } = totals;

		// Заносим в мету
		useEffect(() => {
			if (price !== undefined)

			wp.data.dispatch('core/editor').editPost({
				meta: {
					total_price: separateThousand(Math.round(price)),
				},
			});
		}, [price]);

		const addNewWork = () => {
			const newWork = {
				title: '',
				type: 'fix',
				price: 0,
				workPeriod: 0
			};

			setAttributes({
				works: [
					...works,
					newWork
				]
			});
		};

		const updateWork = (index, field, value) => {
			const newWorks = [...works];
			newWorks[index] = {
				...newWorks[index],
				[field]: value
			};

			setAttributes({ works: newWorks });
		};

		const deleteWork = (index) => {
			const newWorks = works.filter((_, i) => i !== index);

			setAttributes({
				works: newWorks
			});
		};

		const addNewAdditionalCost = () => {
			const newAdditionalCost = {
				title: '',
				price: 0
			};

			setAttributes({
				additionalCosts: [
					...additionalCosts,
					newAdditionalCost
				]
			});
		};

		const updateAdditionalCost = (index, field, value) => {
			const newAdditionalCosts = [...additionalCosts];
			newAdditionalCosts[index] = {
				...newAdditionalCosts[index],
				[field]: value
			};

			setAttributes({ additionalCosts: newAdditionalCosts });
		};

		const deleteAdditionalCost = (index) => {
			const newAdditionalCosts = additionalCosts.filter((_, i) => i !== index);

			setAttributes({
				additionalCosts: newAdditionalCosts
			});
		};

		return (
			<>
				<InspectorControls>
					<PanelBody title="Настройки">
						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							type="number"
							min="0"
							label="Почасовая ставка, ₽/час"
							value={settings?.main?.hourlyRate || 1500}
							onChange={(value) => {
								setAttributes({
									settings: {
										...settings,
										main: {
											...settings?.main,
											hourlyRate: Number(value)
										}
									}
								});
							}}
						/>

						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							type="number"
							min="1"
							max="12"
							label="Рабочих часов в день"
							help="Используется для расчета длительности проекта в днях"
							value={settings?.main?.hoursPerDay || 8}
							onChange={(value) => {
								setAttributes({
									settings: {
										...settings,
										main: {
											...settings?.main,
											hoursPerDay: Number(value)
										}
									}
								});
							}}
						/>

						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							type="number"
							min="0"
							max="100"
							label="Налог, %"
							value={settings?.main?.tax || 6}
							onChange={(value) => {
								setAttributes({
									settings: {
										...settings,
										main: {
											...settings?.main,
											tax: Number(value)
										}
									}
								});
							}}
						/>
					</PanelBody>

					<PanelBody title="Надбавки">
						<ToggleControl
							__nextHasNoMarginBottom
							label="Включить NDA"
							checked={settings?.perks?.nda?.activate || false}
							onChange={(value) => {
								setAttributes({
									settings: {
										...settings,
										perks: {
											...settings?.perks,
											nda: {
												...settings?.perks?.nda,
												activate: value
											}
										}
									}
								});
							}}
						/>

						{settings?.perks?.nda?.activate && (
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								type="number"
								min="0"
								max="100"
								label="Значение NDA, %"
								value={settings?.perks?.nda?.value || 30}
								onChange={(value) => {
									setAttributes({
										settings: {
											...settings,
											perks: {
												...settings?.perks,
												nda: {
													...settings?.perks?.nda,
													value: Number(value)
												}
											}
										}
									});
								}}
							/>
						)}

						<ToggleControl
							__nextHasNoMarginBottom
							label="Включить маркетинг"
							checked={settings?.perks?.marketing?.activate || false}
							onChange={(value) => {
								setAttributes({
									settings: {
										...settings,
										perks: {
											...settings?.perks,
											marketing: {
												...settings?.perks?.marketing,
												activate: value
											}
										}
									}
								});
							}}
						/>

						{settings?.perks?.marketing?.activate && (
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								type="number"
								min="0"
								max="100"
								label="Значение маркетинг, %"
								value={settings?.perks?.marketing?.value || 20}
								onChange={(value) => {
									setAttributes({
										settings: {
											...settings,
											perks: {
												...settings?.perks,
												marketing: {
													...settings?.perks?.marketing,
													value: Number(value)
												}
											}
										}
									});
								}}
							/>
						)}

						<ToggleControl
							__nextHasNoMarginBottom
							label="Включить срочность"
							checked={settings?.perks?.quickly?.activate || false}
							onChange={(value) => {
								setAttributes({
									settings: {
										...settings,
										perks: {
											...settings?.perks,
											quickly: {
												...settings?.perks?.quickly,
												activate: value
											}
										}
									}
								});
							}}
						/>

						{settings?.perks?.quickly?.activate && (
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								type="number"
								min="0"
								max="100"
								label="Значение срочность, %"
								value={settings?.perks?.quickly?.value || 25}
								onChange={(value) => {
									setAttributes({
										settings: {
											...settings,
											perks: {
												...settings?.perks,
												quickly: {
													...settings?.perks?.quickly,
													value: Number(value)
												}
											}
										}
									});
								}}
							/>
						)}

						<ToggleControl
							__nextHasNoMarginBottom
							label="Распределить надбавки по позициям"
							help="Если включено, надбавки в сообщении для клиента будут распределены по позициям. Если отключено, надбавки будут прописаны отдельно."
							checked={settings?.perks?.distribution || false}
							onChange={(value) => {
								setAttributes({
									settings: {
										...settings,
										perks: {
											...settings?.perks,
											distribution: value
										}
									}
								});
							}}
						/>
					</PanelBody>

					<PanelBody title="Партнерские">
						<ToggleControl
							__nextHasNoMarginBottom
							label="Включить"
							checked={settings?.parther?.activate || false}
							onChange={(value) => {
								setAttributes({
									settings: {
										...settings,
										parther: {
											...settings?.parther,
											activate: value
										}
									}
								});
							}}
						/>

						{settings?.parther?.activate && (
							<>
								<TextControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									type="number"
									min="0"
									max="100"
									label="Значение партнерских, %"
									value={settings?.parther?.value || 30}
									onChange={(value) => {
										setAttributes({
											settings: {
												...settings,
												parther: {
													...settings?.parther,
													value: Number(value)
												}
											}
										});
									}}
								/>
							</>
						)}
					</PanelBody>
				</InspectorControls>

				<section  {...useBlockProps()}>
					<div className="wp-block-snd-calc-project__container">
						<div className="wp-block-snd-calc-project__grid">
							<div className="wp-block-snd-calc-project__column">
								<div className="wp-block-snd-calc-project__item">
									<h2 className="wp-block-snd-calc-project__item-title">Работы проекта ({works.length || 0})</h2>

									{works.length > 0 ? (
										<div className="wp-block-snd-calc-project__works">
											{works.map((work, key) => {
												const { price, plusPrice } = getWorkPrice(settings, work);

												return (
													<div key={key} className="wp-block-snd-calc-project__works-item">
														<TextControl
															__nextHasNoMarginBottom
															__next40pxDefaultSize
															label="Название"
															placeholder="Введите название"
															value={work?.title || ''}
															onChange={(value) => updateWork(key, 'title', value)}
														/>

														<ToggleGroupControl
															label="Тип расчета"
															value={work?.type}
															isBlock
															__next40pxDefaultSize
															__nextHasNoMarginBottom
															onChange={(value) => updateWork(key, 'type', value)}
														>
															<ToggleGroupControlOption value="fix" label="Фикс" />
															<ToggleGroupControlOption value="hourly" label="Почасовая" />
														</ToggleGroupControl>

														{work?.type === 'fix' ? (
															<>
																<TextControl
																	__nextHasNoMarginBottom
																	__next40pxDefaultSize
																	type="number"
																	min="0"
																	label="Стоимость, ₽"
																	help={(plusPrice > price) && `+допы: ${separateThousand(plusPrice)}₽`}
																	value={price}
																	onChange={(value) => updateWork(key, 'price', Number(value))}
																/>

																<TextControl
																	__nextHasNoMarginBottom
																	__next40pxDefaultSize
																	type="number"
																	min="0"
																	label="Срок, дней"
																	value={work?.workPeriod || 0}
																	onChange={(value) => updateWork(key, 'workPeriod', Number(value))}
																/>
															</>
														) : (
															<>
																<TextControl
																	__nextHasNoMarginBottom
																	__next40pxDefaultSize
																	type="number"
																	min="0"
																	label="Часов"
																	value={work?.hourCounter || 0}
																	onChange={(value) => updateWork(key, 'hourCounter', Number(value))}
																/>

																<TextControl
																	__nextHasNoMarginBottom
																	__next40pxDefaultSize
																	disabled
																	label="Итого, ₽"
																	help={(plusPrice > price) && `+допы: ${separateThousand(plusPrice)}₽`}
																	value={separateThousand(price)}
																/>
															</>
														)}

														<Button
															className="wp-block-snd-calc-project__item-button is-secondary is-destructive"
															size="small"
															onClick={() => deleteWork(key)}
														>
															<Icon icon={closeSmall} size={24} />
														</Button>
													</div>
												)
											})}
										</div>
									) : (
										<div className="wp-block-snd-calc-project__item-placeholder">
											<Icon icon={page} size={36} />
											Добавьте работы к проекту
										</div>
									)}

									<Button
										className="wp-block-snd-calc-project__item-button is-primary"
										size="small"
										onClick={addNewWork}
									>
										<Icon icon={plus} size={24} />
										Добавить работу
									</Button>
								</div>

								<div className="wp-block-snd-calc-project__item">
									<h2 className="wp-block-snd-calc-project__item-title">Дополнительные расходы</h2>
									{additionalCosts.length > 0 ? (
										<div className="wp-block-snd-calc-project__additionalCosts">
											{additionalCosts.map((additionalCost, key) => (
												<div key={key} className="wp-block-snd-calc-project__additionalCosts-item">
													<TextControl
														__nextHasNoMarginBottom
														__next40pxDefaultSize
														label="Название"
														placeholder="Введите название"
														value={additionalCost?.title || ''}
														onChange={(value) => updateAdditionalCost(key, 'title', value)}
													/>

													<TextControl
														__nextHasNoMarginBottom
														__next40pxDefaultSize
														type="number"
														min="0"
														label="Стоимость, ₽"
														value={additionalCost?.price || 0}
														onChange={(value) => updateAdditionalCost(key, 'price', Number(value))}
													/>

													<Button
														className="wp-block-snd-calc-project__item-button is-secondary is-destructive"
														size="small"
														onClick={() => deleteAdditionalCost(key)}
													>
														<Icon icon={closeSmall} size={24} />
													</Button>
												</div>
											))}
										</div>
									) : (
										<div className="wp-block-snd-calc-project__item-placeholder">
											<Icon icon={currencyDollar} size={36} />
											Добавьте дополнительные расходы
										</div>
									)}

									<Button
										className="wp-block-snd-calc-project__item-button is-primary"
										size="small"
										onClick={addNewAdditionalCost}
									>
										<Icon icon={plus} size={24} />
										Добавить расход
									</Button>
								</div>

								<div className="wp-block-snd-calc-project__item">
									<h2 className="wp-block-snd-calc-project__item-title">Заметка проекта</h2>
									<TextareaControl
										__nextHasNoMarginBottom
										placeholder="Введите заметки к проекту..."
										value={note || ''}
										onChange={(note) => setAttributes({ note })}
									/>
								</div>
							</div>

							<div className="wp-block-snd-calc-project__column">
								<div className="wp-block-snd-calc-project__item">
									<h2 className="wp-block-snd-calc-project__item-title">Итоговая стоимость для клиента</h2>
									<div className="wp-block-snd-calc-project__item-total">
										<div className="wp-block-snd-calc-project__item-total-price">
											{separateThousand(totals?.price || 0)}₽
										</div>

										<div className="wp-block-snd-calc-project__item-total-item">
											Срок работы: <span>{totals?.workPeriod || 0} {wordForm(totals?.workPeriod || 0, ['день', 'дня', 'дней'])}</span>
										</div>

										<div className="wp-block-snd-calc-project__item-total-item">
											Часовая ставка: <span>{separateThousand(totals?.hourlyRate || 0)}₽</span>
										</div>
									</div>

									{
										(settings?.perks?.nda?.activate || settings?.perks?.marketing?.activate || settings?.perks?.quickly?.activate) &&
										(
											<div className="wp-block-snd-calc-project__item-perks">
												<div className="wp-block-snd-calc-project__item-perks-item">
													Базовая стоимость
													<span>
														{separateThousand(totals?.basePrice || 0)}₽
													</span>
												</div>

												{settings?.perks?.nda?.activate && (
													<div className="wp-block-snd-calc-project__item-perks-item">
														NDA ({settings?.perks?.nda?.value}%)
														<span>
															+{separateThousand((totals?.basePrice || 0) * (settings?.perks?.nda?.value / 100))}₽
														</span>
													</div>
												)}

												{settings?.perks?.marketing?.activate && (
													<div className="wp-block-snd-calc-project__item-perks-item">
														Маркетинг ({settings?.perks?.marketing?.value}%)
														<span>
															+{separateThousand((totals?.basePrice || 0) * (settings?.perks?.marketing?.value / 100))}₽
														</span>
													</div>
												)}

												{settings?.perks?.quickly?.activate && (
													<div className="wp-block-snd-calc-project__item-perks-item">
														Срочность ({settings?.perks?.quickly?.value}%)
														<span>
															+{separateThousand((totals?.basePrice || 0) * (settings?.perks?.quickly?.value / 100))}₽
														</span>
													</div>
												)}

												<div className="wp-block-snd-calc-project__item-perks-item total">
													Итого с учетом надбавок
													<span>
														{separateThousand(totals?.price || 0)}₽
													</span>
												</div>
											</div>
										)
									}


									<div className="wp-block-snd-calc-project__item-additionalCosts">
										<div className="wp-block-snd-calc-project__item-additionalCosts-item">
											Налог
											<span>
												{separateThousand(totals?.tax || 0)}₽
											</span>
										</div>

										{settings?.parther?.activate && (
											<div className="wp-block-snd-calc-project__item-additionalCosts-item">
												Партнеру ({settings?.parther?.value || 0}%)
												<span>
													{separateThousand(totals?.partnerAmount || 0)}₽
												</span>
											</div>
										)}


										<div className="wp-block-snd-calc-project__item-additionalCosts-item">
											Дополнительные расходы
											<span>
												{separateThousand(totals?.additionalCosts || 0)}₽
											</span>
										</div>
										<div className="wp-block-snd-calc-project__item-additionalCosts-item total">
											Все расходы
											<span>
												{separateThousand((totals?.tax || 0) + (totals?.additionalCosts || 0) + (totals?.partnerAmount || 0))}₽
											</span>
										</div>
									</div>

									<div className="wp-block-snd-calc-project__item-profit">
										<div className="wp-block-snd-calc-project__item-profit-label">Прибыль</div>
										<div className={`wp-block-snd-calc-project__item-profit-value ${(totals?.profit || 0) < 0 ? 'minus' : ''}`}>
											{separateThousand(totals?.profit || 0)}₽
										</div>
									</div>
								</div>

								<div className="wp-block-snd-calc-project__item">
									<h2 className="wp-block-snd-calc-project__item-title">Сообщение для клиента</h2>

									<div className="wp-block-snd-calc-project__message-for-client">
										{message}
									</div>

									<Button
										className="wp-block-snd-calc-project__item-button is-outline"
										size="small"
										tone="neutral"
										onClick={async () => {
											try {
												await navigator.clipboard.writeText(message);
											} catch (e) {
												console.error('Ошибка копирования', e);
											}
										}}
									>
										<Icon icon={copySmall} size={24} />
										Коприровать текст
									</Button>
								</div>
							</div>
						</div>
					</div>
				</section>
			</>
		);
	},
	save: () => {
		return null;
	},
});

const calculateTotals = ({ settings, works, additionalCosts }) => {
	const hourlyRate = settings?.main?.hourlyRate || 1500;
	const hoursPerDay = settings?.main?.hoursPerDay || 8;
	const taxPercent = settings?.main?.tax || 6;

	// 1. Работы
	let worksPrice = 0;
	let totalHours = 0;
	let totalDays = 0;

	works.forEach((work) => {
		if (work.type === 'fix') {
			worksPrice += work.price || 0;
			totalDays += work.workPeriod || 0;
		} else {
			const hours = work.hourCounter || 0;

			worksPrice += hours * hourlyRate;
			totalHours += hours;
		}
	});

	// перевод часов в дни
	totalDays += Math.ceil(totalHours / hoursPerDay);
	const basePrice = worksPrice;

	// 2. Надбавки
	let perksPercent = 0;

	const perks = settings?.perks || {};

	if (perks?.nda?.activate) perksPercent += perks.nda.value || 0;
	if (perks?.marketing?.activate) perksPercent += perks.marketing.value || 0;
	if (perks?.quickly?.activate) perksPercent += perks.quickly.value || 0;

	const perksAmount = worksPrice * (perksPercent / 100);

	// 3. Доп расходы
	const additionalCostsSum = additionalCosts.reduce(
		(sum, item) => sum + (item.price || 0),
		0
	);

	// 5. Итог до налога
	let subtotal = worksPrice + perksAmount;

	// 4. Партнёрка
	let partnerAmount = 0;
	let subPartnerAmount = 0;
	if (settings?.parther?.activate) {
		subPartnerAmount = subtotal * ((settings.parther.value || 0) / 100);
		partnerAmount = subtotal * ((settings.parther.value || 0) / 100);
	}

	// 6. Налог
	const taxAmount = subtotal * (taxPercent / 100);

	// 7. Финальная цена
	const totalPrice = subtotal;

	return {
		basePrice,
		price: Math.round(totalPrice),
		workPeriod: totalDays,
		hourlyRate,
		tax: Math.round(taxAmount),
		additionalCosts: additionalCostsSum,
		subPartnerAmount,
		partnerAmount,
		profit: Math.round(totalPrice - taxAmount - additionalCostsSum)
	};
};

const buildMessage = ({ settings, works, totals }) => {
	const lines = [];

	lines.push('Работы проекта:\n');

	works.forEach((work, key) => {
		const title = work.title || 'Без названия';
		const { price, plusPrice } = getWorkPrice(settings, work);

		lines.push(`— ${title}: ${separateThousand(plusPrice > 0 ? plusPrice : price)}₽`);

		if (key !== (works.length - 1)) {
			lines.push('\n');
		}
	});

	if (!settings?.perks?.distribution) {
		lines.push('\n');
		if (settings?.perks?.nda?.activate) {
			lines.push(`\nNDA: ${separateThousand((totals?.basePrice || 0) * (settings?.perks?.nda?.value / 100))}₽`);
		}
		if (settings?.perks?.marketing?.activate) {
			lines.push(`\nМаркетинг: ${separateThousand((totals?.basePrice || 0) * (settings?.perks?.marketing?.value / 100))}₽`);
		}
		if (settings?.perks?.quickly?.activate) {
			lines.push(`\nСрочность: ${separateThousand((totals?.basePrice || 0) * (settings?.perks?.quickly?.value / 100))}₽`);
		}
	}


	lines.push(`\n\nСрок работы: ${totals.workPeriod} ${wordForm(totals?.workPeriod || 0, ['день', 'дня', 'дней'])}`);
	lines.push(`\nИтоговая сумма: ${separateThousand(totals.price)}₽`);

	return lines.join('');
};

const getWorkPrice = (settings, work) => {
	let price = 0;
	let plusPricePrecent = 0;
	let plusPrice = 0;

	if (work.type === 'fix') {
		price = work.price || 0;
	} else {
		price = (work.hourCounter || 0) * settings?.main?.hourlyRate;
	}

	if (settings?.perks?.distribution) {
		if (settings?.perks?.nda?.activate) {
			plusPricePrecent += Number(settings?.perks?.nda?.value);
		}
		if (settings?.perks?.marketing?.activate) {
			plusPricePrecent += Number(settings?.perks?.marketing?.value);
		}
		if (settings?.perks?.quickly?.activate) {
			plusPricePrecent += Number(settings?.perks?.quickly?.value);
		}
	}

	plusPrice = price + price * (plusPricePrecent / 100);

	return {
		price,
		plusPrice
	};
};

const wordForm = (num,word) => {
	const cases = [2, 0, 1, 1, 1, 2];
	return word[ (num%100>4 && num%100<20)? 2 : cases[(num%10<5)?num%10:5] ];
};

const separateThousand = (num) => {
	return num.toLocaleString('ru-RU');
};