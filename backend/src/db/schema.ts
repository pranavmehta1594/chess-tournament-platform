import { pgTable, uuid, varchar, text, timestamp, integer, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['COACH', 'STUDENT']);
export const tournamentStatusEnum = pgEnum('tournament_status', ['DRAFT', 'OPEN', 'ONGOING', 'COMPLETED']);
export const matchStatusEnum = pgEnum('match_status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABORTED']);
export const matchResultEnum = pgEnum('match_result', ['WHITE_WIN', 'BLACK_WIN', 'DRAW', 'ONGOING']);
export const terminationReasonEnum = pgEnum('termination_reason', [
  'CHECKMATE',
  'RESIGNATION',
  'TIMEOUT',
  'STALEMATE',
  'INSUFFICIENT_MATERIAL',
  'AGREEMENT',
]);

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('STUDENT'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Tournaments Table
export const tournaments = pgTable('tournaments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  timeControl: varchar('time_control', { length: 50 }).notNull().default('5+0'),
  initialTimeSeconds: integer('initial_time_seconds').notNull().default(300),
  incrementSeconds: integer('increment_seconds').notNull().default(0),
  startDateTime: timestamp('start_date_time', { withTimezone: true }).notNull(),
  status: tournamentStatusEnum('status').notNull().default('DRAFT'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  winnerId: uuid('winner_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Tournament Participants
export const tournamentParticipants = pgTable('tournament_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  scoreMillipoints: integer('score_millipoints').notNull().default(0), // 1000 = 1.0 point, 500 = 0.5 point
  wins: integer('wins').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  buchholzScore: integer('buchholz_score').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('tournament_user_idx').on(table.tournamentId, table.userId),
]);

// 4. Matches
export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
  whitePlayerId: uuid('white_player_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  blackPlayerId: uuid('black_player_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: matchStatusEnum('status').notNull().default('PENDING'),
  result: matchResultEnum('result').notNull().default('ONGOING'),
  terminationReason: terminationReasonEnum('termination_reason'),
  pgn: text('pgn').notNull().default(''),
  finalFen: varchar('final_fen', { length: 255 }).notNull().default('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
  whiteTimeRemainingMs: integer('white_time_remaining_ms').notNull(),
  blackTimeRemainingMs: integer('black_time_remaining_ms').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  participations: many(tournamentParticipants),
  createdTournaments: many(tournaments),
  whiteMatches: many(matches, { relationName: 'whitePlayer' }),
  blackMatches: many(matches, { relationName: 'blackPlayer' }),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  creator: one(users, {
    fields: [tournaments.createdBy],
    references: [users.id],
  }),
  winner: one(users, {
    fields: [tournaments.winnerId],
    references: [users.id],
  }),
  participants: many(tournamentParticipants),
  matches: many(matches),
}));

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentParticipants.tournamentId],
    references: [tournaments.id],
  }),
  user: one(users, {
    fields: [tournamentParticipants.userId],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [matches.tournamentId],
    references: [tournaments.id],
  }),
  whitePlayer: one(users, {
    fields: [matches.whitePlayerId],
    references: [users.id],
    relationName: 'whitePlayer',
  }),
  blackPlayer: one(users, {
    fields: [matches.blackPlayerId],
    references: [users.id],
    relationName: 'blackPlayer',
  }),
}));

