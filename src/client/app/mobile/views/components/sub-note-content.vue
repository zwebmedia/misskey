<template>
<div class="mk-sub-note-content">
	<div class="body">
		<span v-if="note.isHidden" style="opacity: 0.5">(%i18n:@private%)</span>
		<span v-if="note.deletedAt" style="opacity: 0.5">(%i18n:@deleted%)</span>
		<a class="reply" v-if="note.replyId">%fa:reply%</a>
		<misskey-flavored-markdown v-if="note.text" :text="note.text" :i="$store.state.i"/>
		<a class="rp" v-if="note.renoteId">RN: ...</a>
	</div>
	<details v-if="note.files.length > 0">
		<summary>({{ '%i18n:@media-count%'.replace('{}', note.files.length) }})</summary>
		<mk-media-list :media-list="note.files"/>
	</details>
	<details v-if="note.poll">
		<summary>%i18n:@poll%</summary>
		<mk-poll :note="note"/>
	</details>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['note']
});
</script>

<style lang="stylus" scoped>
.mk-sub-note-content
	overflow-wrap break-word

	> .body
		> .reply
			margin-right 6px
			color #717171

		> .rp
			margin-left 4px
			font-style oblique
			color var(--renoteText)

	mk-poll
		font-size 80%

</style>
