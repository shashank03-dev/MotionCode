# MotionCode — hackathon demo script (one shot)

One continuous script for a live demo on **motioncode.live**, starting from
login. Read it top to bottom. The lines in [brackets] are your stage cues.
Full run is about 3 minutes. If the clock is tight, you can skip the
"Under the hood" section and still land the demo.

> **Presenter note:** a free account gets **one analysis per day**, and it runs
> a real AI model over the network. Rehearse on a throwaway account the day
> before, then keep your demo account fresh for a clean run on stage. Keep the
> recorded clip and a screenshot of a good result open in another tab as backup.

---

## Intro

Hi everyone, I'm Shashank. I'm from Bangalore, and I'm doing my BE in
Information Science. The thing I built is called MotionCode.

## The hook

Every front-end dev has done this. You see a nice animation somewhere online and
you want it in your own app. So you open dev tools and start guessing — how long
is it, what's the easing, why does mine feel a little off. An hour later you're
still nudging numbers.

MotionCode does that guessing for you. You show it the animation, and it hands
you the code.

## The live demo

Let me show you on the real site. [go to motioncode.live]

1. First I log in. You can use Google or a magic link — no password to
   remember. [sign in, land on the app]

2. Now I'll drop in a clip. It's a card that fades in and settles, the kind of
   entrance you see on any landing page. [drag `motioncode-demo-entrance.mp4`
   onto the upload area]

3. Watch what happens. The app pulls a few frames out of the video right here in
   my browser, then sends just those frames to be analyzed. [click Analyze, or
   press Cmd/Ctrl+Enter]

4. Give it a second. [let the progress run]

5. Here's what comes back. It knows this is an entrance. It read the duration and
   the easing curve. It even scored the performance and left a note about reduced
   motion, so the animation stays kind to people who get motion sick. [point at
   the motion spec]

6. Now the part I like. Here's the code it wrote. This tab is plain CSS
   keyframes. This one is a GSAP timeline. This one is a Framer Motion component,
   and there's a React Spring one too. Same animation, written four ways. [click
   across the CSS / GSAP / Framer / Spring tabs]

7. And the panel on the right runs that code live, so I can watch it play and
   check it matches before I copy a single line. [show the preview replaying]

8. I'll take the CSS one. One click to copy, and it's on my clipboard, ready to
   paste into a real project. [click copy]

That part that usually eats an afternoon just took about ten seconds.

## Under the hood

The demo is the easy part to show. A lot of the real work is in the parts you
don't see, so let me walk through those.

**Your video.** When you drop a clip in, the frames come out in your browser, and
only those few still images go to the server. Not the whole file. And here is the
part I care about most: those images are never saved. The server reads them, gets
the motion, and drops them. The only thing we keep is the spec and the generated
code. Your source clip stays yours.

**Login and access.** The server never trusts a cookie on its own. On every
protected page it asks Supabase "who is this, really?" and checks the answer.
Every table in the database has row-level security, so even a hand-crafted
request can't read data that isn't yours. The file storage is private, and every
path is tied to the owner's id.

**The daily limit.** Free accounts get one run a day. That count doesn't live in
your browser where you could clear it. It's a locked reservation in the database,
one row per user. So you can't get extra runs by clearing cookies or firing ten
requests at once. It books your slot first, then calls the model.

**Payments.** When someone upgrades, the payment provider sends a signed message.
We verify that signature with a constant-time check before we trust any of it,
and the same event can't be counted twice. Your plan is decided on the server
from the real plan id, never from anything the browser claims.

## The plans

There are three tiers. Free is one analysis a day, six frames, and a read-only
studio where you preview and copy. Pro moves you to a hundred a day, more frames,
a stronger model, saved projects with version history, and share links. Studio
goes up to five hundred a day, the most frames, team comments, and more seats. So
it fits one person trying it out, all the way up to a small team shipping
together.

## The stack (one line)

It's a Next.js app on Vercel, with Supabase for the database, auth, and storage,
Google's Gemini for the analysis, and Razorpay for payments. It's typed end to
end and covered by unit and browser tests.

## The close

So that's MotionCode. You see motion you like, and you walk away with the code —
in CSS, GSAP, Framer Motion, or React Spring — in a few seconds instead of an
afternoon. Thanks for watching.
