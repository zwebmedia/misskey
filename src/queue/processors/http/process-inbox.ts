import * as bq from 'bee-queue';
import * as debug from 'debug';

const httpSignature = require('http-signature');
import parseAcct from '../../../misc/acct/parse';
import User, { IRemoteUser } from '../../../models/user';
import perform from '../../../remote/activitypub/perform';
import { resolvePerson, updatePerson } from '../../../remote/activitypub/models/person';
import { toUnicode } from 'punycode';
import { URL } from 'url';

const log = debug('misskey:queue:inbox');

// ユーザーのinboxにアクティビティが届いた時の処理
export default async (job: bq.Job, done: any): Promise<void> => {
	const signature = job.data.signature;
	const activity = job.data.activity;

	//#region Log
	const info = Object.assign({}, activity);
	delete info['@context'];
	delete info['signature'];
	log(info);
	//#endregion

	const keyIdLower = signature.keyId.toLowerCase();
	let user: IRemoteUser;

	if (keyIdLower.startsWith('acct:')) {
		const { username, host } = parseAcct(keyIdLower.slice('acct:'.length));
		if (host === null) {
			console.warn(`request was made by local user: @${username}`);
			done();
			return;
		}

		// アクティビティ内のホストの検証
		try {
			ValidateActivity(activity, host);
		} catch (e) {
			console.warn(e.message);
			done();
			return;
		}

		user = await User.findOne({ usernameLower: username, host: host.toLowerCase() }) as IRemoteUser;
	} else {
		// アクティビティ内のホストの検証
		const host = toUnicode(new URL(signature.keyId).hostname.toLowerCase());
		try {
			ValidateActivity(activity, host);
		} catch (e) {
			console.warn(e.message);
			done();
			return;
		}

		user = await User.findOne({
			host: { $ne: null },
			'publicKey.id': signature.keyId
		}) as IRemoteUser;
	}

	// Update activityの場合は、ここで署名検証/更新処理まで実施して終了
	if (activity.type === 'Update') {
		if (activity.object && activity.object.type === 'Person') {
			if (user == null) {
				console.warn('Update activity received, but user not registed.');
			} else if (!httpSignature.verifySignature(signature, user.publicKey.publicKeyPem)) {
				console.warn('Update activity received, but signature verification failed.');
			} else {
				updatePerson(activity.actor, null, activity.object);
			}
		}
		done();
		return;
	}

	// アクティビティを送信してきたユーザーがまだMisskeyサーバーに登録されていなかったら登録する
	if (user === null) {
		user = await resolvePerson(activity.actor) as IRemoteUser;
	}

	if (user === null) {
		done(new Error('failed to resolve user'));
		return;
	}

	if (!httpSignature.verifySignature(signature, user.publicKey.publicKeyPem)) {
		console.warn('signature verification failed');
		done();
		return;
	}

	// アクティビティを処理
	try {
		await perform(user, activity);
		done();
	} catch (e) {
		done(e);
	}
};

/**
 * Validate host in activity
 * @param activity Activity
 * @param host Expect host
 */
function ValidateActivity(activity: any, host: string) {
	// id (if exists)
	if (typeof activity.id === 'string') {
		const uriHost = toUnicode(new URL(activity.id).hostname.toLowerCase());
		if (host !== uriHost) {
			const diag = activity.signature ? '. Has LD-Signature. Forwarded?' : '';
			throw new Error(`activity.id(${activity.id}) has different host(${host})${diag}`);
		}
	}

	// actor (if exists)
	if (typeof activity.actor === 'string') {
		const uriHost = toUnicode(new URL(activity.actor).hostname.toLowerCase());
		if (host !== uriHost) throw new Error('activity.actor has different host');
	}

	// For Create activity
	if (activity.type === 'Create' && activity.object) {
		// object.id (if exists)
		if (typeof activity.object.id === 'string') {
			const uriHost = toUnicode(new URL(activity.object.id).hostname.toLowerCase());
			if (host !== uriHost) throw new Error('activity.object.id has different host');
		}

		// object.attributedTo (if exists)
		if (typeof activity.object.attributedTo === 'string') {
			const uriHost = toUnicode(new URL(activity.object.attributedTo).hostname.toLowerCase());
			if (host !== uriHost) throw new Error('activity.object.attributedTo has different host');
		}
	}
}
