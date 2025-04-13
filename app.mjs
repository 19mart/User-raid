import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField,
} from 'discord.js';

const DISCORD_TOKEN = 'tokeni yaz';
const CLIENT_ID = 'application idni yaz';

const commands = [
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('Spam yapıyom')
    .addStringOption(option =>
      option.setName('message').setDescription('Spamlanacak mesaj').setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('delay').setDescription('Mesajlar arası gecikme kral 1 yap geç trol yapacaksan 10 felan yap saniye arasından yapıyo bot').setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('everyone_here')
        .setDescription('@everyone @here ekleyekmi?')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('ara')
    .setDescription('Harici uygulamalara izin verilen kanalları listeler')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('[INFO] Slash komutları yükleniyo');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('[INFO] Slash komutları başarıyla yüklendi');
  } catch (error) {
    console.error('[ERROR] Komutlar yüklenemedi yarramı ye:', error);
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: { parse: ['everyone'] }
});

const buttonMessageMap = new Map();
const spamActive = new Map();

client.once(Events.ClientReady, () => {
  console.log(`[INFO] Bot giriş yaptım: ${client.user.tag} (${client.user.id})`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'başla') {
    const userMessage = interaction.options.getString('message');
    const delay = interaction.options.getNumber('delay') ?? 1;
    const mentionEveryone = interaction.options.getBoolean('everyone_here') ?? false;

    const startButtonId = `send_${interaction.id}`;
    const stopButtonId = `stop_${interaction.id}`;
    buttonMessageMap.set(startButtonId, { message: userMessage, delay, mentionEveryone });

    const startButton = new ButtonBuilder()
      .setCustomId(startButtonId)
      .setLabel('Başlat')
      .setStyle(ButtonStyle.Primary);

    const stopButton = new ButtonBuilder()
      .setCustomId(stopButtonId)
      .setLabel('Durdur')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(startButton, stopButton);

    await interaction.reply({
      content: 'her başlat butonuna bastığında 5 mesaj gönderiyom habire bas',
      components: [row],
      ephemeral: true
    });

    console.log(`[INFO] /start komutunu kullandı bi oç - ${interaction.user.tag}`);

  } else if (interaction.isChatInputCommand() && interaction.commandName === 'ara') {
    if (!interaction.guild) {
      await interaction.reply('Bu komut sadece ananın amında çalışır');
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const channels = await interaction.guild.channels.fetch();
    const result = [];

    for (const [, channel] of channels) {
      if (channel?.type !== 0) continue; // Metin kanalları (GUILD_TEXT)
      const perms = channel.permissionsFor(interaction.guild.roles.everyone);
      if (perms?.has(PermissionsBitField.Flags.UseExternalEmojis)) {
        result.push(`#${channel.name}`);
      }
    }

    const content = result.length
      ? `Harici uygulamalara izin verilen kanallar:\n${result.join('\n')}`
      : 'Hiçbir kanalda harici emojilere/stickerlara izin verilmiyor yarramı ye';

    await interaction.editReply({ content });

  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith('send_')) {
      const stored = buttonMessageMap.get(interaction.customId);
      if (!stored) {
        await interaction.reply({ content: 'Geçersiz ya da eski buton.', ephemeral: true });
        return;
      }

      const { message, delay, mentionEveryone } = stored;
      const finalMessage = mentionEveryone ? `${message} @everyone @here` : message;

      if (spamActive.has(interaction.user.id)) {
        await interaction.reply({ content: 'yarram bi dur aq çok hızlısın rahat dur bacını aynı o hızda sikerim orospu oğlu ananmı çalışıyo burda amın piçi', ephemeral: true });
        return;
      }

      spamActive.set(interaction.user.id, true);

      await interaction.reply({ content: finalMessage });
      console.log(`[INFO] Mesaj gönderildi: ${finalMessage}`);

      for (let i = 0; i < 4; i++) { 
        await new Promise(resolve => setTimeout(resolve, delay * 1)); 
        try {
          await interaction.followUp({ content: finalMessage });
          console.log(`[INFO] Mesaj ${i + 2}/5 gönderildi: ${finalMessage}`);
        } catch (error) {
          console.error('[ERROR] Mesaj gönderilemedi:', error);
          break;
        }
      }

      spamActive.delete(interaction.user.id);
      console.log(`[INFO] Spam bitti - ${interaction.user.tag}`);

    } else if (interaction.customId.startsWith('stop_')) {
      await interaction.reply({ content: 'spam bitti yarram neye basıyon', ephemeral: true });
    }
  }
});

(async () => {
  await registerCommands();
  console.log('[INFO] bota giriyom');
  client.login(DISCORD_TOKEN);
})();
//discord.gg/sexs
//çalanında satanında allahını sikeyim amın türemeleri 
