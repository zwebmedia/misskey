import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { packMany } from '../../../../models/note';
import UserList from '../../../../models/user-list';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストのタイムラインを取得します。',
		'en-US': 'Get timeline of a user list.'
	},

	requireCredential: true,

	params: {
		listId: $.type(ID).note({
			desc: {
				'ja-JP': 'リストのID'
			}
		}),

		limit: $.num.optional.range(1, 100).note({
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		}),

		sinceId: $.type(ID).optional.note({
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより新しい投稿を取得します'
			}
		}),

		untilId: $.type(ID).optional.note({
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより古い投稿を取得します'
			}
		}),

		sinceDate: $.num.optional.note({
			desc: {
				'ja-JP': '指定した時間を基点としてより新しい投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		}),

		untilDate: $.num.optional.note({
			desc: {
				'ja-JP': '指定した時間を基点としてより古い投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		}),

		includeMyRenotes: $.bool.optional.note({
			default: true,
			desc: {
				'ja-JP': '自分の行ったRenoteを含めるかどうか'
			}
		}),

		includeRenotedMyNotes: $.bool.optional.note({
			default: true,
			desc: {
				'ja-JP': 'Renoteされた自分の投稿を含めるかどうか'
			}
		}),

		includeLocalRenotes: $.bool.optional.note({
			default: true,
			desc: {
				'ja-JP': 'Renoteされたローカルの投稿を含めるかどうか'
			}
		}),

		withFiles: $.bool.optional.note({
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		}),

		mediaOnly: $.bool.optional.note({
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		}),
	}
};

export default async (params: any, user: ILocalUser) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

	const [list, mutedUserIds] = await Promise.all([
		// リストを取得
		// Fetch the list
		UserList.findOne({
			_id: ps.listId,
			userId: user._id
		}),

		// ミュートしているユーザーを取得
		Mute.find({
			muterId: user._id
		}).then(ms => ms.map(m => m.muteeId))
	]);

	if (list.userIds.length == 0) {
		return [];
	}

	//#region Construct query
	const sort = {
		_id: -1
	};

	const listQuery = list.userIds.map(u => ({
		userId: u,

		// リプライは含めない(ただし投稿者自身の投稿へのリプライ、自分の投稿へのリプライ、自分のリプライは含める)
		$or: [{
			// リプライでない
			replyId: null
		}, { // または
			// リプライだが返信先が投稿者自身の投稿
			$expr: {
				$eq: ['$_reply.userId', '$userId']
			}
		}, { // または
			// リプライだが返信先が自分(フォロワー)の投稿
			'_reply.userId': user._id
		}, { // または
			// 自分(フォロワー)が送信したリプライ
			userId: user._id
		}]
	}));

	const query = {
		$and: [{
			deletedAt: null,

			// リストに入っている人のタイムラインへの投稿
			$or: listQuery,

			// mute
			userId: {
				$nin: mutedUserIds
			},
			'_reply.userId': {
				$nin: mutedUserIds
			},
			'_renote.userId': {
				$nin: mutedUserIds
			},
		}]
	} as any;

	// MongoDBではトップレベルで否定ができないため、De Morganの法則を利用してクエリします。
	// つまり、「『自分の投稿かつRenote』ではない」を「『自分の投稿ではない』または『Renoteではない』」と表現します。
	// for details: https://en.wikipedia.org/wiki/De_Morgan%27s_laws

	if (ps.includeMyRenotes === false) {
		query.$and.push({
			$or: [{
				userId: { $ne: user._id }
			}, {
				renoteId: null
			}, {
				text: { $ne: null }
			}, {
				fileIds: { $ne: [] }
			}, {
				poll: { $ne: null }
			}]
		});
	}

	if (ps.includeRenotedMyNotes === false) {
		query.$and.push({
			$or: [{
				'_renote.userId': { $ne: user._id }
			}, {
				renoteId: null
			}, {
				text: { $ne: null }
			}, {
				fileIds: { $ne: [] }
			}, {
				poll: { $ne: null }
			}]
		});
	}

	if (ps.includeLocalRenotes === false) {
		query.$and.push({
			$or: [{
				'_renote.user.host': { $ne: null }
			}, {
				renoteId: null
			}, {
				text: { $ne: null }
			}, {
				fileIds: { $ne: [] }
			}, {
				poll: { $ne: null }
			}]
		});
	}

	const withFiles = ps.withFiles != null ? ps.withFiles : ps.mediaOnly;

	if (withFiles) {
		query.$and.push({
			fileIds: { $exists: true, $ne: [] }
		});
	}

	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query._id = {
			$lt: ps.untilId
		};
	} else if (ps.sinceDate) {
		sort._id = 1;
		query.createdAt = {
			$gt: new Date(ps.sinceDate)
		};
	} else if (ps.untilDate) {
		query.createdAt = {
			$lt: new Date(ps.untilDate)
		};
	}
	//#endregion

	// Issue query
	const timeline = await Note
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	// Serialize
	return await packMany(timeline, user);
};
