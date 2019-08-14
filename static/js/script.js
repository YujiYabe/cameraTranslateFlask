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
		// isShowButtonScanFile: false,
		// isShowZoneScanedText: false,
		// isShowZoneDoneTranslate: false,
		isShowButtonScanFile: true,
		isShowZoneScanedText: true,
		isShowZoneDoneTranslate: true,

		langPair: {
			ja: 'jp',
			en: 'en',
			es: 'es',
			fr: 'fr',
			zh: 'zh',
			ru: 'ru',
		},
		langSet: {
			ja: 'ja-JP',
			en: 'en-US',
			es: 'es-ES',
			fr: 'fr-FR',
			zh: 'zh-CN',
			ru: 'ru-RU',
			ko: 'ko-KO',
			ar: 'ar-AR',
		},
		resizeImageWidth: 800,
		resizeImageHeight: 0,
	},
	mounted() {
		//デフォルト変換先言語の設定
		let selectedLanguage = localStorage.selectedLanguage;
		if (selectedLanguage != null) {
			this.targetLanguageSymbole = localStorage.selectedLanguage;
		} else {
			this.targetLanguageSymbole = "es";
		}
		this.displayWaitImage(false);
	},
	methods: {


		//=========================================================================-
		canvasDraw: function (event) {
			let file = document.getElementById('imageSelect').files[0];
			let isImageFile = file.name.match(/.(jpg|jpeg|png|gif)$/i);
			if (!isImageFile) {
				alert("画像ファイルを選択してください");
				document.getElementById('imageSelect').value = ''; //選択したファイルをクリア
			} else {
				let fr = new FileReader(), self = this;
				fr.onload = function () {
					document.getElementById('preview').src = fr.result;//選択した画像を一旦imgタグに表示
					//imgタグに表示した画像をimageオブジェクトとして取得
					let image = new Image();
					image.src = document.getElementById('preview').src;
					let id = setInterval(function () {
						//縦横比を維持した縮小サイズを取得
						self.resizeImageHeight = image.height * (self.resizeImageWidth / image.width);
						let canvas = document.getElementById('canvas');
						let ctx = canvas.getContext('2d');
						document.getElementById('canvas').setAttribute('width', self.resizeImageWidth);
						document.getElementById('canvas').setAttribute('height', self.resizeImageHeight);
						ctx.drawImage(image, 0, 0, self.resizeImageWidth, self.resizeImageHeight);
						clearInterval(id);　//idをclearIntervalで指定している
					}, 10);
				};
				this.isShowPreview = true;
				this.isShowButtonScanFile = true;
				fr.readAsDataURL(file);
			}
		},

		//=========================================================================-
		imageUpload: function (event) {
			this.displayWaitImage(true);
			let formData = new FormData(document.getElementById('imageForm'));
			if (Object.keys(document.getElementById('canvas')).length) {
				//canvasに描画したデータを取得
				let canvasImage = document.getElementById('canvas');
				//オリジナル容量(画質落としてない場合の容量)を取得
				let originalBinary = canvasImage.toDataURL("image/jpeg"); //画質落とさずバイナリ化
				let originalBlob = this.base64ToBlob(originalBinary); //オリジナル容量blobデータを取得

				//オリジナル容量blobデータをアップロード用blobに設定
				let uploadBlob = originalBlob;

				//オリジナル容量が2MB以上かチェック
				if (2000000 <= originalBlob["size"]) {
					let processingBinary = canvasImage.toDataURL("image/jpeg", (2000000 / originalBlob["size"])); //画質落としてバイナリ化
					uploadBlob = base64ToBlob(processingBinary); //画質落としたblobデータをアップロード用blobに設定
				}
				//アップロード用blobをformDataに追加
				formData.append("img_file", uploadBlob);
			}

			axios.post('scan', formData)
				.then(function (res) {
					this.sourceLanguageSymbole = res.data.locale;
					this.sourceTranslatePhrase = res.data.description;
					this.isShowZoneScanedText = true;
					this.displayWaitImage(false);
				}.bind(this)).catch(function (err) {
					console.log(err);
					this.displayWaitImage(false);
				}.bind(this));
		},



		//=========================================================================-
		translateText: function (event) {
			this.displayWaitImage(true);

			let sourceTranslatePhrase = document.getElementById('sourceTranslatePhrase').innerText;
			let targetLanguageSymbole = this.targetLanguageSymbole;

			if (this.langPair[this.sourceLanguageSymbole] == targetLanguageSymbole) {
				this.isShowZoneDoneTranslate = true;
				this.targetTranslatePhrase = targetTranslate;
				this.displayWaitImage(false);
				return;
			} else {
				let post_data = new URLSearchParams();
				post_data.append('text', sourceTranslatePhrase);
				post_data.append('target', targetLanguageSymbole);
				axios.post('translate', post_data)
					.then(function (res) {
						this.isShowZoneDoneTranslate = true;
						this.targetTranslatePhrase = res.data.translatedText;
						this.displayWaitImage(false);
					}.bind(this)).catch(function (err) {
						this.displayWaitImage(false);
						console.log(err);
					}.bind(this));
			}
		},

		//=========================================================================-
		speechText: function (event) {
			this.displayWaitImage(true);
			speechSynthesis.cancel();

			let targetLanguageSymbole = this.targetLanguageSymbole;

			let synthes = new SpeechSynthesisUtterance();
			synthes.voiceURI = 'native';
			synthes.volume = 1;
			synthes.rate = 0.9;
			synthes.pitch = 0;
			synthes.text = this.targetTranslatePhrase;
			synthes.lang = this.langSet[targetLanguageSymbole];

			speechSynthesis.speak(synthes);
			this.displayWaitImage(false);

		},


		//=========================================================================-
		pushSelectedLanguage: function (langName, event) {
			let selectLang = langName;
			this.targetLanguageSymbole = selectLang;
			localStorage.selectedLanguage = selectLang;
		},


		// 引数のBase64の文字列をBlob形式にする
		//=========================================================================-
		base64ToBlob: function (base64, event) {
			let base64Data = base64.split(',')[1], // Data URLからBase64のデータ部分のみを取得
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
			let isWaitImageZone = 'none';
			let isApplicationZone = 'block'
			if (isWait) {
				isWaitImageZone = 'block';
				isApplicationZone = 'none'
			}
			document.getElementById('waitImageZone').style.display = isWaitImageZone;
			document.getElementById('applicationZone').style.display = isApplicationZone;
		},


	}
})


