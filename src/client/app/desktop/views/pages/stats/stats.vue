<template>
<div class="tcrwdhwpuxrwmcttxjcsehgpagpstqey">
	<div v-if="stats" class="stats">
		<div><b>%fa:user% {{ stats.originalUsersCount | number }}</b><span>%i18n:@original-users%</span></div>
		<div><span>%fa:user% {{ stats.usersCount | number }}</span><span>%i18n:@all-users%</span></div>
		<div><b>%fa:pencil-alt% {{ stats.originalNotesCount | number }}</b><span>%i18n:@original-notes%</span></div>
		<div><span>%fa:pencil-alt% {{ stats.notesCount | number }}</span><span>%i18n:@all-notes%</span></div>
	</div>
	<div>
		<x-charts/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XCharts from "../../components/charts.vue";

export default Vue.extend({
	components: {
		XCharts
	},
	data() {
		return {
			stats: null
		};
	},
	created() {
		(this as any).api('stats').then(stats => {
			this.stats = stats;
		});
	},
});
</script>

<style lang="stylus">


.tcrwdhwpuxrwmcttxjcsehgpagpstqey
	width 100%
	padding 16px

	> .stats
		display flex
		justify-content center
		margin 0 auto 16px auto
		padding 32px
		background #fff
		box-shadow 0 2px 8px rgba(#000, 0.1)

		> div
			flex 1
			text-align center

			> *:first-child
				display block
				color var(--primary)

			> *:last-child
				font-size 70%

	> div
		max-width 950px
		margin 0 auto
</style>
