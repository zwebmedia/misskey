<template>
<div class="mk-admin-card">
	<header>%i18n:@unsuspend-user%</header>
	<input v-model="username" type="text" class="ui"/>
	<button class="ui" @click="unsuspendUser" :disabled="unsuspending">%i18n:@unsuspend%</button>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import parseAcct from "../../../../../../misc/acct/parse";

export default Vue.extend({
	data() {
		return {
			username: null,
			unsuspending: false
		};
	},
	methods: {
		async unsuspendUser() {
			this.unsuspending = true;

			const process = async () => {
				const user = await (this as any).os.api(
					"users/show",
					parseAcct(this.username)
				);

				await (this as any).os.api("admin/unsuspend-user", {
					userId: user.id
				});

				(this as any).os.apis.dialog({ text: "%i18n:@unsuspended%" });
			};

			await process().catch(e => {
				(this as any).os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.unsuspending = false;

		}
	}
});
</script>

<style lang="stylus" scoped>


header
	margin 10px 0


button
	margin 16px 0

</style>
