// https://github.com/sekiyaeiji/vue2x-demo/blob/master/README.md

new Vue({
	el: '#app',
	data: {
		sourceLanguageSymbole: '',
		sourceTranslatePhrase: '',
		targetLanguageSymbole: '',
		targetTranslatePhrase: '',

		isShowPreview: false,
		// wait: true, 
		isShowButtonScanFile: false,
		isShowZoneScanedText: false,
		isShowZoneDoneTranslate: false,
		// isShowButtonScanFile: true,
		// isShowZoneScanedText: true,
		// isShowZoneDoneTranslate: true,

	},
	mounted() {
		//デフォルト変換先言語の設定
		var selectedLanguage = localStorage.selectedLanguage;
		if (selectedLanguage != null) {
			this.targetLanguageSymbole = localStorage.selectedLanguage;
		} else {
			this.targetLanguageSymbole = "es";
		}
		// this.wait = false;
		this.displayWaitImage(false);

	},
	methods: {


		//=========================================================================-
		canvasDraw: function (event) {
			var file = document.getElementById('imageSelect').files[0];

			// //画像ファイルかチェック
			if (file["type"] != "image/jpeg" && file["type"] != "image/png" && file["type"] != "image/gif") {
				alert("画像ファイルを選択してください");
				document.getElementById('imageSelect').value = ''; //選択したファイルをクリア
			} else {

				var fr = new FileReader();

				fr.onload = function () {
					//選択した画像を一旦imgタグに表示
					document.getElementById('preview').src = fr.result;

					//imgタグに表示した画像をimageオブジェクトとして取得
					var image = new Image();
					image.src = document.getElementById('preview').src;

					var id = setInterval(function () {

						if (image.width > 0) {

							//縦横比を維持した縮小サイズを取得
							var w = 800;
							var ratio = w / image.width;
							var h = image.height * ratio;

							//canvasに描画
							var canvas = document.getElementById('canvas');
							var ctx = canvas.getContext('2d');
							document.getElementById('canvas').setAttribute('width', w);
							document.getElementById('canvas').setAttribute('height', h);

							ctx.drawImage(image, 0, 0, w, h);

							clearInterval(id);　//idをclearIntervalで指定している
						}
					}, 10);

				};
				this.isShowPreview = true;
				this.isShowButtonScanFile = true;

				fr.readAsDataURL(file);
			}

		},

		//=========================================================================-
		imageUpload: function (event) {
			// this.wait = true;
			this.displayWaitImage(true);
			var form = document.getElementById('imageForm');
			var formData = new FormData(form);

			//画像処理してformDataに追加
			if (Object.keys(document.getElementById('canvas')).length) {

				//canvasに描画したデータを取得
				var canvasImage = document.getElementById('canvas');

				//オリジナル容量(画質落としてない場合の容量)を取得
				var originalBinary = canvasImage.toDataURL("image/jpeg"); //画質落とさずバイナリ化
				var originalBlob = this.base64ToBlob(originalBinary); //オリジナル容量blobデータを取得

				//オリジナル容量blobデータをアップロード用blobに設定
				var uploadBlob = originalBlob;

				//オリジナル容量が2MB以上かチェック
				if (2000000 <= originalBlob["size"]) {
					//2MB以下に落とす
					var capacityRatio = 2000000 / originalBlob["size"];
					var processingBinary = canvasImage.toDataURL("image/jpeg", capacityRatio); //画質落としてバイナリ化
					uploadBlob = base64ToBlob(processingBinary); //画質落としたblobデータをアップロード用blobに設定
				}

				//アップロード用blobをformDataに追加
				formData.append("img_file", uploadBlob);
			}
			// console.log(this.wait);

			axios.post('scan', formData)
				.then(function (res) {
					localStorage.sourceLanguageSymbole = res.data.locale;
					localStorage.sourceTranslatePhrase = res.data.description;

					this.sourceLanguageSymbole = localStorage.sourceLanguageSymbole;
					this.sourceTranslatePhrase = localStorage.sourceTranslatePhrase;

					// document.getElementById('targetTranslatePhrase').innerText = sourceTranslatePhrase ; 

					this.isShowZoneScanedText = true;
					// this.wait = false;
					this.displayWaitImage(false);

				}.bind(this)).catch(function (err) {
					console.log(err);
					// this.wait = false;
					this.displayWaitImage(false);
				}.bind(this));

		},



		//=========================================================================-
		translateText: function (event) {
			this.displayWaitImage(true);
			var langPair = {};
			langPair.ja = 'jp';
			langPair.en = 'en';
			langPair.es = 'es';
			langPair.fr = 'fr';
			langPair.zh = 'zh';
			langPair.ru = 'ru';

			localStorage.sourceTranslatePhrase = this.sourceTranslatePhrase;

			var sourceTranslatePhrase = document.getElementById('sourceTranslatePhrase').innerText;
			var targetLanguageSymbole = this.targetLanguageSymbole;
			var sourceLanguageSymbole = this.sourceLanguageSymbole;


			if (langPair[sourceLanguageSymbole] == targetLanguageSymbole) {

				this.isShowZoneDoneTranslate = true;

				var unescapestr = this.unescapeHTML(targetTranslate);

				this.targetTranslatePhrase = unescapestr;
				this.displayWaitImage(false);

				return;
			} else {

				var post_data = new URLSearchParams();
				// post_data.append('sourceTranslatePhrase', sourceTranslatePhrase);
				// post_data.append('targetLanguageSymbole', targetLanguageSymbole);

				post_data.append('text', sourceTranslatePhrase);
				post_data.append('target', targetLanguageSymbole);

				axios.post('translate', post_data)
					.then(function (res) {
						this.isShowZoneDoneTranslate = true;

						var unescapestr = this.escapeHTML(res.data.translatedText);
						console.log(unescapestr);

						localStorage.targetTranslatePhrase = unescapestr;

						this.targetTranslatePhrase = localStorage.targetTranslatePhrase;
						this.displayWaitImage(false);

					}.bind(this)).catch(function (err) {
						this.displayWaitImage(false);
						console.log(err);
					}.bind(this));
				// this.wait = false;

			}
		},

		//=========================================================================-
		speechText: function (event) {
			this.displayWaitImage(true);
			speechSynthesis.cancel();

			var langPair = {};
			langPair.ja = 'ja-JP';
			langPair.en = 'en-US';
			langPair.es = 'es-ES';
			langPair.fr = 'fr-FR';
			langPair.zh = 'zh-CN';
			langPair.ru = 'ru-RU';
			langPair.ko = 'ko-KO';
			langPair.ar = 'ar-AR';
			var targetLanguageSymbole = this.targetLanguageSymbole;

			var synthes = new SpeechSynthesisUtterance();
			synthes.voiceURI = 'native';
			synthes.volume = 1;
			synthes.rate = 0.9;
			synthes.pitch = 0;
			synthes.text = this.targetTranslatePhrase;
			synthes.lang = langPair[targetLanguageSymbole];

			speechSynthesis.speak(synthes);
			this.displayWaitImage(false);

		},

		//=========================================================================-
		pushSourceTranslatePhrase: function (event) {
			localStorage.sourceTranslatePhrase = this.sourceTranslatePhrase;
		},


		//=========================================================================-
		pushSelectedLanguage: function (langName, event) {
			var selectLang = langName;
			this.targetLanguageSymbole = selectLang;
			localStorage.selectedLanguage = selectLang;
		},

		//=========================================================================-
		unescapeHTML: function (str, event) {
			var returnstr = str
				.replace(/&/g, "&amp;")
				.replace(/'/g, "&#x27;")
				.replace(/`/g, "&#x60;")
				.replace(/"/g, "&quot;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/\r/g, "&#13;")
				.replace(/\n/g, "&#10;")

				; //-----------------------
			return returnstr;
		},

		//=========================================================================-
		escapeHTML: function (str, event) {
			var returnstr = str
				.replace(/&amp;/g, "&")
				.replace(/&#x27;/g, "'")
				.replace(/&#39;/g, "'")
				.replace(/&#x60;/g, "`")
				.replace(/&quot;/g, '"')
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&#13;/g, "\r")
				.replace(/&#10;/g, "\n")
				; //-----------------------
			return returnstr;
		},

		// 引数のBase64の文字列をBlob形式にする
		//=========================================================================-
		base64ToBlob: function (base64, event) {
			var base64Data = base64.split(',')[1], // Data URLからBase64のデータ部分のみを取得
				data = window.atob(base64Data), // base64形式の文字列をデコード
				buff = new ArrayBuffer(data.length),
				arr = new Uint8Array(buff),
				blob,
				i,
				dataLen;
			// blobの生成
			for (i = 0, dataLen = data.length; i < dataLen; i++) {
				arr[i] = data.charCodeAt(i);
			}
			blob = new Blob([arr], { type: 'image/jpeg' });
			return blob;

		},
		//=========================================================================-
		displayWaitImage: function (isWait, event) {
			if (isWait) {
				document.getElementById('waitImageZone').style.display = 'block';
				document.getElementById('applicationZone').style.display = 'none';
			} else {
				document.getElementById('waitImageZone').style.display = 'none';
				document.getElementById('applicationZone').style.display = 'block';
			}
		},


		// //=========================================================================-
		// testClick: function (event) {
		// 	if (this.wait) {
		// 		this.wait = false;
		// 	} else {
		// 		this.wait = true;
		// 	}
		// },


	}
})


