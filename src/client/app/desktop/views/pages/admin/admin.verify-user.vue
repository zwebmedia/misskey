<template>
<div class="mk-admin-card">
	<header>%i18n:@verify-user%</header>
	<input v-model="username" type="text" class="ui"/>
	<button class="ui" @click="verifyUser" :disabled="verifying">%i18n:@verify%</button>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import parseAcct from "../../../../../../misc/acct/parse";

export default Vue.extend({
	data() {
		return {
			username: null,
			verifying: false
		};
	},
	methods: {
		async verifyUser() {
			this.verifying = true;

			const process = async () => {
				const user = await (this as any).os.api(
					"users/show",
					parseAcct(this.username)
				);

				await (this as any).os.api("admin/verify-user", {
					userId: user.id
				});

				(this as any).os.apis.dialog({ text: "%i18n:@verified%" });
			};

			await process().catch(e => {
				(this as any).os.apis.dialog({ text: `Failed: ${e}` });
			});

			this.verifying = false;
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
