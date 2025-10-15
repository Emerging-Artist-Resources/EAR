--
-- PostgreSQL database dump
--

\restrict tcJGH47jw5fOHgiGmACwyLq5cPDVO7eZeL2PWoWCxxP3fdFjbYWc7JfMTXloPfY

-- Dumped from database version 15.14 (Homebrew)
-- Dumped by pg_dump version 15.14 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: kaylalaufer
--

CREATE TYPE public."NotificationType" AS ENUM (
    'INFO',
    'WARNING',
    'SUCCESS',
    'ERROR'
);


ALTER TYPE public."NotificationType" OWNER TO kaylalaufer;

--
-- Name: PerformanceStatus; Type: TYPE; Schema: public; Owner: kaylalaufer
--

CREATE TYPE public."PerformanceStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."PerformanceStatus" OWNER TO kaylalaufer;

--
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: kaylalaufer
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ReviewStatus" OWNER TO kaylalaufer;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: kaylalaufer
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO kaylalaufer;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: kaylalaufer
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO kaylalaufer;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: kaylalaufer
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO kaylalaufer;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: kaylalaufer
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type public."NotificationType" DEFAULT 'INFO'::public."NotificationType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "authorId" text NOT NULL
);


ALTER TABLE public.notifications OWNER TO kaylalaufer;

--
-- Name: performances; Type: TABLE; Schema: public; Owner: kaylalaufer
--

CREATE TABLE public.performances (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    date timestamp(3) without time zone NOT NULL,
    "time" text,
    location text,
    performer text NOT NULL,
    "contactEmail" text,
    "contactPhone" text,
    status public."PerformanceStatus" DEFAULT 'PENDING'::public."PerformanceStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text
);


ALTER TABLE public.performances OWNER TO kaylalaufer;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: kaylalaufer
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    status public."ReviewStatus" NOT NULL,
    comments text,
    "reviewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "performanceId" text NOT NULL,
    "reviewerId" text NOT NULL
);


ALTER TABLE public.reviews OWNER TO kaylalaufer;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: kaylalaufer
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO kaylalaufer;

--
-- Name: users; Type: TABLE; Schema: public; Owner: kaylalaufer
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO kaylalaufer;

--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: kaylalaufer
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO kaylalaufer;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: kaylalaufer
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
009724e9-c56a-43a2-ba20-373a6a0564f0	c6cfa628058bc8f7aa7baf4b42e1b3f171a3e32785169a6faad6c86042619462	2025-10-01 09:16:58.981547-04	20251001131658_init	\N	\N	2025-10-01 09:16:58.972841-04	1
d4e0166e-e520-42e0-b8f3-4d7abd35146e	2c8610b70299567abe78b4683bd56c124a2093509b547f80a1304a09f302529a	2025-10-01 13:19:47.046079-04	20251001171947_allow_anonymous_submissions	\N	\N	2025-10-01 13:19:47.044934-04	1
f159e952-8ce8-4fb3-a592-8f1bd81bca5d	3d6945d977f0e21e4b4e498d108ee419f73aa7b940de2d5c9507d2c8ee910444	2025-10-05 11:43:34.730773-04	20251005154334_add_notifications	\N	\N	2025-10-05 11:43:34.727511-04	1
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: kaylalaufer
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: kaylalaufer
--

COPY public.notifications (id, title, content, type, "isActive", "createdAt", "updatedAt", "authorId") FROM stdin;
cmgdvrdmk0003jpiiqwbyu415	Test02	Test02 Warning	INFO	t	2025-10-05 15:52:13.244	2025-10-05 19:52:03.951	cmg80gtgv0000itq6ze9dsn3i
\.


--
-- Data for Name: performances; Type: TABLE DATA; Schema: public; Owner: kaylalaufer
--

COPY public.performances (id, title, description, date, "time", location, performer, "contactEmail", "contactPhone", status, "createdAt", "updatedAt", "userId") FROM stdin;
cmg87wffj0002s1q05hvcvoke	Test-Performance01	Testing the calendar	2025-10-08 00:00:00	19:00	New York, NY	Test01	Test01@gmail.com	Test01	APPROVED	2025-10-01 16:45:27.198	2025-10-01 16:46:30.472	cmg87ux5z0000s1q02p9kkl9s
cmg89eh1b0001s17gpsiprlae	Test-Anon01	Testing anonymous submission	2025-10-07 00:00:00	19:00	New York, NY	Test-Anon01	anon01@gmail.com	5678	APPROVED	2025-10-01 17:27:28.703	2025-10-01 17:27:59.076	\N
cmg89x6560006s17gikdlpi6n	Test02	Testing multiple performances on 1 day	2025-10-07 04:00:00	17:45	New York, NY	Test02	Test02@gmail.com	777553333	APPROVED	2025-10-01 17:42:01.045	2025-10-01 17:43:31.175	cmg89t3eq0004s17gauvmv916
cmg8a35dx000as17gn8brites	Test03	Testing calendar 03	2025-10-20 04:00:00	17:45	New York, NY	Test03	Test03@gmail.com	5678882222	APPROVED	2025-10-01 17:46:40.005	2025-10-01 17:47:13.205	\N
cmgdx1ime0004jpiix62jryom	Test04-Anon	Anon test	2025-11-05 05:00:00	12:30	New York, NY	Test-Anon02	anon02@gmail.com	5678882222	REJECTED	2025-10-05 16:28:05.894	2025-10-05 16:28:53.826	\N
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: kaylalaufer
--

COPY public.reviews (id, status, comments, "reviewedAt", "createdAt", "updatedAt", "performanceId", "reviewerId") FROM stdin;
cmg87xs900004s1q0t57138y2	APPROVED	\N	2025-10-01 16:46:30.469	2025-10-01 16:46:30.469	2025-10-01 16:46:30.469	cmg87wffj0002s1q05hvcvoke	cmg80gtgv0000itq6ze9dsn3i
cmg89f4gw0003s17gspish2hl	APPROVED	\N	2025-10-01 17:27:59.073	2025-10-01 17:27:59.073	2025-10-01 17:27:59.073	cmg89eh1b0001s17gpsiprlae	cmg80gtgv0000itq6ze9dsn3i
cmg89z3ol0008s17gicpcfdo2	APPROVED	Merde!	2025-10-01 17:43:31.173	2025-10-01 17:43:31.173	2025-10-01 17:43:31.173	cmg89x6560006s17gikdlpi6n	cmg80gtgv0000itq6ze9dsn3i
cmg8a3v01000cs17gl4lizn04	APPROVED	\N	2025-10-01 17:47:13.201	2025-10-01 17:47:13.201	2025-10-01 17:47:13.201	cmg8a35dx000as17gn8brites	cmg80gtgv0000itq6ze9dsn3i
cmgdx2jls0006jpiijxql4w0o	REJECTED	\N	2025-10-05 16:28:53.824	2025-10-05 16:28:53.824	2025-10-05 16:28:53.824	cmgdx1ime0004jpiix62jryom	cmg80gtgv0000itq6ze9dsn3i
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: kaylalaufer
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: kaylalaufer
--

COPY public.users (id, email, name, password, role, "emailVerified", image, "createdAt", "updatedAt") FROM stdin;
cmg80gtgv0000itq6ze9dsn3i	admin@example.com	Admin User	$2b$12$EZRZ8YrrTaYTYRkUt7Fs8ea6B2Y1v8.yEORHtzVFlrw9kBK.KjCgm	ADMIN	\N	\N	2025-10-01 13:17:21.583	2025-10-01 13:17:21.583
cmg87ux5z0000s1q02p9kkl9s	Test01@gmail.com	Test01	$2b$12$8OG9OB.qpFPnMBge2C1LyeDvDJIYsAASSIrlT8x8Qe9S5/MY9Gjzi	USER	\N	\N	2025-10-01 16:44:16.871	2025-10-01 16:44:16.871
cmg89t3eq0004s17gauvmv916	Test02@gmail.com	Test02	$2b$12$GK59FuQ8HVzUyhhXvbGyY.gVoa.jwqdfo7cOQmSmPA5q5a4Jqiv5e	USER	\N	\N	2025-10-01 17:38:50.882	2025-10-01 17:38:50.882
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: kaylalaufer
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: performances performances_pkey; Type: CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.performances
    ADD CONSTRAINT performances_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: kaylalaufer
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: kaylalaufer
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: kaylalaufer
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: kaylalaufer
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: kaylalaufer
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: performances performances_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.performances
    ADD CONSTRAINT "performances_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_performanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES public.performances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kaylalaufer
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict tcJGH47jw5fOHgiGmACwyLq5cPDVO7eZeL2PWoWCxxP3fdFjbYWc7JfMTXloPfY

