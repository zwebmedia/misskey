<template>
<ui-card>
	<div slot="title">%fa:user% %i18n:@title%</div>

	<section class="fit-top">
		<ui-form :disabled="saving">
			<ui-input v-model="name" :max="30">
				<span>%i18n:@name%</span>
			</ui-input>

			<ui-input v-model="username" readonly>
				<span>%i18n:@account%</span>
				<span slot="prefix">@</span>
				<span slot="suffix">@{{ host }}</span>
			</ui-input>

			<ui-input v-model="location">
				<span>%i18n:@location%</span>
				<span slot="prefix">%fa:map-marker-alt%</span>
			</ui-input>

			<ui-input v-model="birthday" type="date">
				<span>%i18n:@birthday%</span>
				<span slot="prefix">%fa:birthday-cake%</span>
			</ui-input>

			<ui-textarea v-model="description" :max="500">
				<span>%i18n:@description%</span>
			</ui-textarea>

			<ui-input type="file" @change="onAvatarChange">
				<span>%i18n:@avatar%</span>
				<span slot="icon">%fa:image%</span>
				<span slot="text" v-if="avatarUploading">%i18n:@uploading%<mk-ellipsis/></span>
			</ui-input>

			<ui-input type="file" @change="onBannerChange">
				<span>%i18n:@banner%</span>
				<span slot="icon">%fa:image%</span>
				<span slot="text" v-if="bannerUploading">%i18n:@uploading%<mk-ellipsis/></span>
			</ui-input>

			<ui-button @click="save(true)">%i18n:@save%</ui-button>
		</ui-form>
	</section>

	<section>
		<header>%i18n:@advanced%</header>

		<div>
			<ui-switch v-model="isCat" @change="save(false)">%i18n:@is-cat%</ui-switch>
			<ui-switch v-model="isBot" @change="save(false)">%i18n:@is-bot%</ui-switch>
			<ui-switch v-model="alwaysMarkNsfw">%i18n:common.always-mark-nsfw%</ui-switch>
		</div>
	</section>

	<section>
		<header>%i18n:@privacy%</header>

		<div>
			<ui-switch v-model="isLocked" @change="save(false)">%i18n:@is-locked%</ui-switch>
			<ui-switch v-model="carefulBot" @change="save(false)">%i18n:@careful-bot%</ui-switch>
		</div>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, host } from '../../../config';

export default Vue.extend({
	data() {
		return {
			host,
			name: null,
			username: null,
			location: null,
			description: null,
			birthday: null,
			avatarId: null,
			bannerId: null,
			isCat: false,
			isBot: false,
			isLocked: false,
			carefulBot: false,
			saving: false,
			avatarUploading: false,
			bannerUploading: false
		};
	},

	computed: {
		alwaysMarkNsfw: {
			get() { return this.$store.state.i.settings.alwaysMarkNsfw; },
			set(value) { (this as any).api('i/update', { alwaysMarkNsfw: value }); }
		},
	},

	created() {
		this.name = this.$store.state.i.name || '';
		this.username = this.$store.state.i.username;
		this.location = this.$store.state.i.profile.location;
		this.description = this.$store.state.i.description;
		this.birthday = this.$store.state.i.profile.birthday;
		this.avatarId = this.$store.state.i.avatarId;
		this.bannerId = this.$store.state.i.bannerId;
		this.isCat = this.$store.state.i.isCat;
		this.isBot = this.$store.state.i.isBot;
		this.isLocked = this.$store.state.i.isLocked;
		this.carefulBot = this.$store.state.i.carefulBot;
	},

	methods: {
		onAvatarChange([file]) {
			this.avatarUploading = true;

			const data = new FormData();
			data.append('file', file);
			data.append('i', this.$store.state.i.token);

			fetch(apiUrl + '/drive/files/create', {
				method: 'POST',
				body: data
			})
				.then(response => response.json())
				.then(f => {
					this.avatarId = f.id;
					this.avatarUploading = false;
				})
				.catch(e => {
					this.avatarUploading = false;
					alert('%18n:@upload-failed%');
				});
		},

		onBannerChange([file]) {
			this.bannerUploading = true;

			const data = new FormData();
			data.append('file', file);
			data.append('i', this.$store.state.i.token);

			fetch(apiUrl + '/drive/files/create', {
				method: 'POST',
				body: data
			})
				.then(response => response.json())
				.then(f => {
					this.bannerId = f.id;
					this.bannerUploading = false;
				})
				.catch(e => {
					this.bannerUploading = false;
					alert('%18n:@upload-failed%');
				});
		},

		save(notify) {
			this.saving = true;

			(this as any).api('i/update', {
				name: this.name || null,
				location: this.location || null,
				description: this.description || null,
				birthday: this.birthday || null,
				avatarId: this.avatarId,
				bannerId: this.bannerId,
				isCat: this.isCat,
				isBot: this.isBot,
				isLocked: this.isLocked,
				carefulBot: this.carefulBot
			}).then(i => {
				this.saving = false;
				this.$store.state.i.avatarId = i.avatarId;
				this.$store.state.i.avatarUrl = i.avatarUrl;
				this.$store.state.i.bannerId = i.bannerId;
				this.$store.state.i.bannerUrl = i.bannerUrl;

				if (notify) {
					this.$swal({
						type: 'success',
						text: '%i18n:@saved%'
					});
				}
			});
		}
	}
});
</script>
