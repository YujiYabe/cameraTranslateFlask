/*
 *
 *  Air Horner
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
// importScripts('serviceworker-cache-polyfill.js');

const version = "0.3";
const cacheName = `camera-translate-${version}`;

self.addEventListener('install', e => {
	const timeStamp = Date.now();
	e.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll([
					`/`,
					`/index.html`,
					'/public/css/additional.css',
					'/public/css/additional.less',
					'/public/css/vuetify.min.css',
					'/public/js/axios.min.js',
					'/public/js/less.min.js',
					'/public/js/script.js',
					'/public/js/vue.min.js',
					'/public/js/vuetify.js',
					'/public/wait.gif',
					'/manifest.json',
				])
				.then(() => self.skipWaiting());
		})
	);
});



self.addEventListener('activate', (event) => {
	var cacheWhitelist = [cacheName];

	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					// ホワイトリストにないキャッシュ(古いキャッシュ)は削除する
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request)
		.then((response) => {
			if (response) {
				return response;
			}

			// 重要：リクエストを clone する。リクエストは Stream なので
			// 一度しか処理できない。ここではキャッシュ用、fetch 用と2回
			// 必要なので、リクエストは clone しないといけない
			let fetchRequest = event.request.clone();

			return fetch(fetchRequest)
				.then((response) => {
					if (!response || response.status !== 200 || response.type !== 'basic') {
						return response;
					}

					// 重要：レスポンスを clone する。レスポンスは Stream で
					// ブラウザ用とキャッシュ用の2回必要。なので clone して
					// 2つの Stream があるようにする
					let responseToCache = response.clone();

					caches.open(cacheName)
						.then((cache) => {
							cache.put(event.request, responseToCache);
						});

					return response;
				});
		})
	);
});