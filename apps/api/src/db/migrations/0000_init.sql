CREATE TABLE "allocations" (
	"farm_id" text NOT NULL,
	"month" text NOT NULL,
	"allocation_m3" numeric NOT NULL,
	CONSTRAINT "allocations_farm_id_month_pk" PRIMARY KEY("farm_id","month")
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"farm_id" text NOT NULL,
	"name" jsonb NOT NULL,
	"crop" text NOT NULL,
	"variety" text NOT NULL,
	"area_ha" numeric NOT NULL,
	"trees" integer,
	"method" text NOT NULL,
	"efficiency" numeric NOT NULL,
	"wetted_fraction" numeric NOT NULL,
	"fc" numeric NOT NULL,
	"wp" numeric NOT NULL,
	"root_depth_mm" integer NOT NULL,
	"kc" numeric NOT NULL,
	"et0_factor" numeric NOT NULL,
	"paw_threshold" numeric NOT NULL,
	"paw_target" numeric NOT NULL,
	"flow_m3h" numeric NOT NULL,
	"priority" integer NOT NULL,
	"source_id" text NOT NULL,
	"fixed_schedule_m3_day" numeric NOT NULL,
	"mode" text NOT NULL,
	"geometry" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"lat" numeric NOT NULL,
	"lon" numeric NOT NULL,
	"timezone" text NOT NULL,
	"pump_capacity_m3h" numeric NOT NULL,
	"night_start" text NOT NULL,
	"night_end" text NOT NULL,
	"pulse_times" text[] NOT NULL,
	"utilities" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "irrigation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"volume_m3" numeric NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"sensor_id" text NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"paw" numeric NOT NULL,
	"vwc" numeric NOT NULL,
	CONSTRAINT "readings_sensor_id_ts_pk" PRIMARY KEY("sensor_id","ts")
);
--> statement-breakpoint
CREATE TABLE "sensors" (
	"id" text PRIMARY KEY NOT NULL,
	"block_id" text NOT NULL,
	"depth_cm" integer,
	"kind" text NOT NULL,
	"weight" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"block_id" text,
	"kind" text NOT NULL,
	"title" jsonb NOT NULL,
	"due_date" date NOT NULL,
	"assignee" text NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "water_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"farm_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" jsonb NOT NULL,
	"ec_ds_m" numeric
);
--> statement-breakpoint
CREATE TABLE "weather_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_source_id_water_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."water_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "irrigation_events" ADD CONSTRAINT "irrigation_events_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_sensor_id_sensors_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_sources" ADD CONSTRAINT "water_sources_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_block_started" ON "irrigation_events" USING btree ("block_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "readings_sensor_ts_desc" ON "readings" USING btree ("sensor_id","ts" DESC NULLS LAST);