<template>
<header class="bvonvjxbwzaiskogyhbwgyxvcgserpmu">
	<mk-avatar class="avatar" :user="note.user" v-if="$store.state.device.postStyle == 'smart'"/>
	<router-link class="name" :to="note.user | userPage" v-user-preview="note.user.id">{{ note.user | userName }}</router-link>
	<span class="is-verified" v-if="note.user.isVerified" title="%i18n:common.verified-user%">%fa:star%</span>
	<span class="is-admin" v-if="note.user.isAdmin">admin</span>
	<span class="is-bot" v-if="note.user.isBot">bot</span>
	<span class="is-cat" v-if="note.user.isCat">cat</span>
	<span class="username"><mk-acct :user="note.user"/></span>
	<div class="info">
		<span class="app" v-if="note.app && !mini">via <b>{{ note.app.name }}</b></span>
		<span class="mobile" v-if="note.viaMobile">%fa:mobile-alt%</span>
		<router-link class="created-at" :to="note | notePage">
			<mk-time :time="note.createdAt"/>
		</router-link>
		<span class="visibility" v-if="note.visibility != 'public'">
			<template v-if="note.visibility == 'home'">%fa:home%</template>
			<template v-if="note.visibility == 'followers'">%fa:unlock%</template>
			<template v-if="note.visibility == 'specified'">%fa:envelope%</template>
			<template v-if="note.visibility == 'private'">%fa:lock%</template>
		</span>
	</div>
</header>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		note: {
			type: Object,
			required: true
		},
		mini: {
			type: Boolean,
			required: false,
			default: false
		}
	}
});
</script>

<style lang="stylus" scoped>
.bvonvjxbwzaiskogyhbwgyxvcgserpmu
	display flex
	align-items baseline
	white-space nowrap

	> .avatar
		flex-shrink 0
		margin-right 8px
		width 20px
		height 20px
		border-radius 100%

	> .name
		display block
		margin 0 .5em 0 0
		padding 0
		overflow hidden
		color var(--noteHeaderName)
		font-size 1em
		font-weight bold
		text-decoration none
		text-overflow ellipsis

		&:hover
			text-decoration underline

	> .is-verified
		margin-right 8px
		color #4dabf7

	> .is-admin
	> .is-bot
	> .is-cat
		flex-shrink 0
		align-self center
		margin 0 .5em 0 0
		padding 1px 6px
		font-size 80%
		color var(--noteHeaderBadgeFg)
		background var(--noteHeaderBadgeBg)
		border-radius 3px

		&.is-admin
			background var(--noteHeaderAdminBg)
			color var(--noteHeaderAdminFg)

	> .username
		margin 0 .5em 0 0
		overflow hidden
		text-overflow ellipsis
		color var(--noteHeaderAcct)
		flex-shrink 2147483647

	> .info
		margin-left auto
		font-size 0.9em

		> *
			color var(--noteHeaderInfo)

		> .mobile
			margin-right 8px

		> .app
			margin-right 8px
			padding-right 8px
			border-right solid 1px var(--faceDivider)

		> .visibility
			margin-left 8px

</style>
