// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Entity, OneToMany, PrimaryGeneratedColumn, OneToOne } from "typeorm";
import { Chat } from "./chats";
import { CommunityChannel } from "./communities-channels";
import { Message } from "./messages";
import { Article } from "./articles";

@Entity({ name: 'channels' })
export class Channel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @OneToMany(() => Message, (message) => message.channel)
    messages!: Message[];

    @OneToOne(() => CommunityChannel, (communityChannel) => communityChannel.channel, { nullable: true })
    communityChannel!: CommunityChannel | null;

    @OneToOne(() => Chat, (chat) => chat.channel, { nullable: true })
    chat!: Chat | null;

    @OneToOne(() => Article, (article) => article.channel, { nullable: true })
    article!: Article | null;
}
