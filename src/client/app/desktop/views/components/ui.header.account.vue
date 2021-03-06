<template>
<div class="account" v-hotkey.global="keymap">
	<button class="header" :data-active="isOpen" @click="toggle">
		<span class="username">{{ $store.state.i.username }}<template v-if="!isOpen">%fa:angle-down%</template><template v-if="isOpen">%fa:angle-up%</template></span>
		<mk-avatar class="avatar" :user="$store.state.i"/>
	</button>
	<transition name="zoom-in-top">
		<div class="menu" v-if="isOpen">
			<ul>
				<li>
					<router-link :to="`/@${ $store.state.i.username }`">%fa:user%<span>%i18n:@profile%</span>%fa:angle-right%</router-link>
				</li>
				<li @click="drive">
					<p>%fa:cloud%<span>%i18n:@drive%</span>%fa:angle-right%</p>
				</li>
				<li>
					<router-link to="/i/favorites">%fa:star%<span>%i18n:@favorites%</span>%fa:angle-right%</router-link>
				</li>
				<li @click="list">
					<p>%fa:list%<span>%i18n:@lists%</span>%fa:angle-right%</p>
				</li>
				<li @click="followRequests" v-if="($store.state.i.isLocked || $store.state.i.carefulBot)">
					<p>%fa:envelope R%<span>%i18n:@follow-requests%<i v-if="$store.state.i.pendingReceivedFollowRequestsCount">{{ $store.state.i.pendingReceivedFollowRequestsCount }}</i></span>%fa:angle-right%</p>
				</li>
			</ul>
			<ul>
				<li>
					<router-link to="/i/customize-home">%fa:wrench%<span>%i18n:@customize%</span>%fa:angle-right%</router-link>
				</li>
				<li @click="settings">
					<p>%fa:cog%<span>%i18n:@settings%</span>%fa:angle-right%</p>
				</li>
				<li v-if="$store.state.i.isAdmin">
					<router-link to="/admin">%fa:terminal%<span>%i18n:@admin%</span>%fa:angle-right%</router-link>
				</li>
			</ul>
			<ul>
				<li @click="dark">
					<p><span>%i18n:@dark%</span><template v-if="$store.state.device.darkmode">%fa:moon%</template><template v-else>%fa:R moon%</template></p>
				</li>
			</ul>
			<ul>
				<li @click="signout">
					<p class="signout">%fa:power-off%<span>%i18n:@signout%</span></p>
				</li>
			</ul>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkUserListsWindow from './user-lists-window.vue';
import MkFollowRequestsWindow from './received-follow-requests-window.vue';
import MkSettingsWindow from './settings-window.vue';
import MkDriveWindow from './drive-window.vue';
import contains from '../../../common/scripts/contains';

export default Vue.extend({
	data() {
		return {
			isOpen: false
		};
	},
	computed: {
		keymap(): any {
			return {
				'a|m': this.toggle
			};
		}
	},
	beforeDestroy() {
		this.close();
	},
	methods: {
		toggle() {
			this.isOpen ? this.close() : this.open();
		},
		open() {
			this.isOpen = true;
			Array.from(document.querySelectorAll('body *')).forEach(el => {
				el.addEventListener('mousedown', this.onMousedown);
			});
		},
		close() {
			this.isOpen = false;
			Array.from(document.querySelectorAll('body *')).forEach(el => {
				el.removeEventListener('mousedown', this.onMousedown);
			});
		},
		onMousedown(e) {
			e.preventDefault();
			if (!contains(this.$el, e.target) && this.$el != e.target) this.close();
			return false;
		},
		drive() {
			this.close();
			(this as any).os.new(MkDriveWindow);
		},
		list() {
			this.close();
			const w = (this as any).os.new(MkUserListsWindow);
			w.$once('choosen', list => {
				this.$router.push(`i/lists/${ list.id }`);
			});
		},
		followRequests() {
			this.close();
			(this as any).os.new(MkFollowRequestsWindow);
		},
		settings() {
			this.close();
			(this as any).os.new(MkSettingsWindow);
		},
		signout() {
			(this as any).os.signout();
		},
		dark() {
			this.$store.commit('device/set', {
				key: 'darkmode',
				value: !this.$store.state.device.darkmode
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.account
	> .header
		display block
		margin 0
		padding 0
		color var(--desktopHeaderFg)
		border none
		background transparent
		cursor pointer

		*
			pointer-events none

		&:hover
		&[data-active='true']
			color var(--desktopHeaderHoverFg)

			> .avatar
				filter saturate(150%)

		> .username
			display block
			float left
			margin 0 12px 0 16px
			max-width 16em
			line-height 48px
			font-weight bold
			font-family Meiryo, sans-serif
			text-decoration none

			@media (max-width 1100px)
				display none

			[data-fa]
				margin-left 8px

		> .avatar
			display block
			float left
			min-width 32px
			max-width 32px
			min-height 32px
			max-height 32px
			margin 8px 8px 8px 0
			border-radius 4px
			transition filter 100ms ease

			@media (max-width 1100px)
				margin-left 8px

	> .menu
		$bgcolor = var(--face)
		display block
		position absolute
		top 56px
		right -2px
		width 230px
		font-size 0.8em
		background $bgcolor
		border-radius 4px
		box-shadow 0 1px 4px rgba(#000, 0.25)

		&:before
			content ""
			pointer-events none
			display block
			position absolute
			top -28px
			right 12px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px rgba(#000, 0.1)
			border-left solid 14px transparent

		&:after
			content ""
			pointer-events none
			display block
			position absolute
			top -27px
			right 12px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px $bgcolor
			border-left solid 14px transparent

		ul
			display block
			margin 10px 0
			padding 0
			list-style none

			& + ul
				padding-top 10px
				border-top solid 1px var(--faceDivider)

			> li
				display block
				margin 0
				padding 0

				> a
				> p
					display block
					z-index 1
					padding 0 28px
					margin 0
					line-height 40px
					color var(--text)
					cursor pointer

					*
						pointer-events none

					> span:first-child
						padding-left 22px

					> span:nth-child(2)
						> i
							margin-left 4px
							padding 2px 8px
							font-size 90%
							font-style normal
							background var(--primary)
							color var(--primaryForeground)
							border-radius 8px

					> [data-fa]:first-child
						margin-right 6px
						width 16px

					> [data-fa]:last-child
						display block
						position absolute
						top 0
						right 8px
						z-index 1
						padding 0 20px
						font-size 1.2em
						line-height 40px

					&:hover, &:active
						text-decoration none
						background var(--primary)
						color var(--primaryForeground)

					&:active
						background var(--primaryDarken10)

					&.signout
						$color = #e64137

						&:hover, &:active
							background $color
							color #fff

						&:active
							background darken($color, 10%)

.zoom-in-top-enter-active,
.zoom-in-top-leave-active {
	transform-origin: center -16px;
}

</style>
