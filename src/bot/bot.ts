/** @format */

import type { Job } from 'node-schedule';

import { Events, type Client } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';

import { messageContextMenuCommandHandler } from '../interaction-handlers/message-context-menu-command.ts';
import { roleSelectMenuHandler } from '../interaction-handlers/role-select-menu.ts';
import { autocompleteHandler } from '../interaction-handlers/autocomplete.ts';
import { modalSubmitHandler } from '../interaction-handlers/modal-submit.ts';
import { buttonHandler } from '../interaction-handlers/button.ts';

import { createCommandHandlers, type CommandHandler } from '../utils/bot/create-command-handlers.ts';
import { newGuild } from '../utils/constructors/new-guild.ts';
import { logError } from '../utils/log-error.ts';

import { settingsHandler } from '../command-handlers/settings.ts';
import { emotesHandler } from '../command-handlers/emote.ts';

import { messageCreateHandler } from '../message-create-handlers/message-create-handler.ts';

import { GENERAL_CHANNEL_ID_CUTEDOG } from '../discord/guilds.ts';
import { SLASH_COMMAND_NAMES } from '../discord/commands.ts';
import type { Guild } from '../discord/guild.ts';
import type { User } from '../discord/user.ts';

import { MessageBuilderManager } from './message-builder-manager.ts';
import type { DatabaseManager } from './database-manager.ts';
import type { ApiManager } from './api-manager.ts';

/**
 * The central class.
 *
 * @privateRemarks
 *
 * Has a lot of objects.
 */
export class Bot {
  readonly #scheduledJobs: Readonly<Job>[] = [];

  readonly #client: Client;

  readonly #commandHandlers: Map<string, CommandHandler>;

  readonly #messageBuilderManager: Readonly<MessageBuilderManager> = new MessageBuilderManager();
  readonly #databaseManager: Readonly<DatabaseManager>;
  readonly #apiManager: Readonly<ApiManager>;

  readonly #guilds: Readonly<Guild>[];
  readonly #users: Readonly<User>[];

  public constructor(
    client: Client,
    apiManager: Readonly<ApiManager>,
    databaseManager: Readonly<DatabaseManager>,
    guilds: readonly Readonly<Guild>[],
    users: readonly Readonly<User>[]
  ) {
    this.#client = client;

    this.#apiManager = apiManager;
    this.#databaseManager = databaseManager;

    this.#commandHandlers = createCommandHandlers(
      this.#scheduledJobs,
      this.#client,
      this.#messageBuilderManager,
      this.#databaseManager,
      this.#apiManager
    );

    this.#guilds = [...guilds];
    this.#users = [...users];
  }

  public get scheduledJobs(): Readonly<Job>[] {
    return this.#scheduledJobs;
  }
  public get client(): Client {
    return this.#client;
  }
  public get guilds(): readonly Readonly<Guild>[] {
    return this.#guilds;
  }
  public get messageBuilderManager(): Readonly<MessageBuilderManager> {
    return this.#messageBuilderManager;
  }
  public get dataBaseManager(): Readonly<DatabaseManager> {
    return this.#databaseManager;
  }
  public get apiManager(): Readonly<ApiManager> {
    return this.#apiManager;
  }

  public registerListeners(): void {
    this.#registerClientReadyListener();
    this.#registerMessageCreateListener();
    this.#registerInteractionCreateListener();
  }

  #registerClientReadyListener(): void {
    this.#client.on(Events.ClientReady, (): void => {
      const { user, channels } = this.#client;
      if (user === null) throw new Error('Bot client user is empty.');

      user.setStatus('online');
      user.setActivity('2');

      try {
        const { JOIN_VOICE_CHANNEL } = process.env;

        if (JOIN_VOICE_CHANNEL === 'true') {
          const cuteDogGeneralChannel = channels.cache.find(
            (channel: { readonly id: string }) => channel.id === GENERAL_CHANNEL_ID_CUTEDOG
          );

          if (
            cuteDogGeneralChannel !== undefined &&
            cuteDogGeneralChannel.isVoiceBased() &&
            cuteDogGeneralChannel.joinable
          ) {
            joinVoiceChannel({
              channelId: cuteDogGeneralChannel.id,
              guildId: cuteDogGeneralChannel.guild.id,
              adapterCreator: cuteDogGeneralChannel.guild.voiceAdapterCreator,
              selfDeaf: true,
              selfMute: true
            });
          }
        }
      } catch (error) {
        logError(error, 'Error at joining voice channel');
      }

      console.log(`Logged in as ${user.tag}!`);
    });
  }

  #registerMessageCreateListener(): void {
    this.#client.on(Events.MessageCreate, async (message): Promise<void> => {
      const { guildId } = message;
      if (guildId === null || message.author.bot) return;

      const guild =
        this.#guilds.find((guild_) => guild_.id === guildId) ??
        (await (async (): Promise<Readonly<Guild>> => {
          const newGuildWithoutPersonalEmotes_ = await newGuild(
            guildId,
            null,
            undefined,
            this.#databaseManager,
            this.#apiManager
          );
          this.#guilds.push(newGuildWithoutPersonalEmotes_);

          return newGuildWithoutPersonalEmotes_;
        })());

      void messageCreateHandler(this.#client.user?.id ?? null)(
        this.#apiManager.cachedUrl,
        message,
        guild,
        this.#users,
        this.#databaseManager.mediaDatabase
      );
    });
  }

  #registerInteractionCreateListener(): void {
    this.#client.on(Events.InteractionCreate, async (interaction): Promise<void> => {
      //not interaction
      if (
        !interaction.isChatInputCommand() &&
        !interaction.isButton() &&
        !interaction.isAutocomplete() &&
        !interaction.isModalSubmit() &&
        !interaction.isRoleSelectMenu() &&
        !interaction.isMessageContextMenuCommand()
      )
        return;

      const { guildId, user } = interaction;
      if (user.bot) return;

      const guild = await (async (): Promise<Readonly<Guild> | undefined> => {
        if (guildId !== null) {
          const guild_ =
            this.#guilds.find((guildge) => guildge.id === guildId) ??
            (await (async (): Promise<Readonly<Guild>> => {
              const newGuildWithoutPersonalEmotes_ = await newGuild(
                guildId,
                null,
                undefined,
                this.#databaseManager,
                this.#apiManager
              );
              this.#guilds.push(newGuildWithoutPersonalEmotes_);

              return newGuildWithoutPersonalEmotes_;
            })());

          return guild_;
        }

        const guildId_ = ((): string | undefined => {
          const user_ = this.#users.find((userge) => userge.id === interaction.user.id);
          if (user_ === undefined) return undefined;
          return user_.guild?.id;
        })();
        if (guildId_ === undefined) return undefined;
        const guild_ = this.#guilds.find((guildge) => guildge.id === guildId_);
        //there cannot be a case when we found a guildId from a user and we would need to create a guild without personal emotes
        if (guild_ === undefined) throw new Error("Couldn't find guild.");
        return guild_;
      })();

      if (interaction.isModalSubmit()) {
        void modalSubmitHandler(
          this.#guilds,
          this.#users,
          guild,
          this.#messageBuilderManager,
          this.#databaseManager,
          this.#apiManager
        )(interaction);
        return;
      }

      if (interaction.isAutocomplete()) {
        if (guild === undefined) return;
        const { emoteMatcher, twitchClipsMeilisearchIndex, uniqueCreatorNames, uniqueGameIds } = guild;

        void autocompleteHandler(
          emoteMatcher,
          twitchClipsMeilisearchIndex,
          uniqueCreatorNames,
          uniqueGameIds,
          this.#databaseManager
        )(interaction);
        return;
      }

      if (interaction.isRoleSelectMenu()) {
        if (guild === undefined) return;
        void roleSelectMenuHandler(guild, this.#databaseManager)(interaction);
        return;
      }

      if (interaction.isButton()) {
        const user_ = this.#users.find((userge) => userge.id === interaction.user.id);

        const emoteMessageBuilder = await buttonHandler(
          this.#client,
          guild,
          user_,
          this.#messageBuilderManager,
          this.#databaseManager
        )(interaction);

        if (emoteMessageBuilder !== undefined)
          this.#messageBuilderManager.emoteMessageBuilders.push(emoteMessageBuilder);
        return;
      }

      if (interaction.isMessageContextMenuCommand()) {
        void messageContextMenuCommandHandler(this.#databaseManager, this.#apiManager)(interaction);
        return;
      }

      if (interaction.commandName === SLASH_COMMAND_NAMES.settings) {
        void settingsHandler()(interaction, guild);
        return;
      }

      if (guild === undefined) return;

      if (interaction.commandName === SLASH_COMMAND_NAMES.emotes) {
        void emotesHandler(this.#apiManager.cachedUrl)(guild, this.#users, interaction);
        return;
      }

      const commandHandler = this.#commandHandlers.get(interaction.commandName);
      if (commandHandler === undefined) return;
      void commandHandler(interaction, guild);
      // TODO: error handling

      return;
    });
  }
}
