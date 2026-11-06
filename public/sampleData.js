/**
 * Sample Meeting Data for instant loading and demonstration
 * Specifically includes:
 * - 3 participants
 * - Multiple discussion points
 * - 2 explicit decisions
 * - Multiple action items
 * - 1 missing assignee ("Someone should prepare the presentation...")
 * - 1 missing deadline ("...finish the API schema documentation soon")
 */
const SAMPLE_MEETING = {
  title: "Q3 Product Roadmap & Sprint 14 Planning",
  date: new Date().toISOString().split('T')[0],
  participants: "Sarah Chen (Product Lead), Alex Rodriguez (Engineering Lead), Priya Patel (UX Designer)",
  transcript: `[00:00] Sarah Chen:
Good morning everyone. Thanks for joining our Q3 Roadmap and Sprint 14 alignment sync. On today's agenda, we need to review the mobile application latency issues from last sprint, review Priya's latest checkout redesign mockups, and decide on our localization strategy for the upcoming release. Alex, can you kick us off with the backend latency findings?

[01:15] Alex Rodriguez:
Sure Sarah. Looking at our telemetry from last week, our mobile app API response times jumped by roughly 42% during peak hours. The primary bottleneck is our monolithic REST endpoints returning excessive payloads with unneeded nested fields. I've profiled the queries, and two things stand out: missing composite indexes on the orders table, and heavy payload overhead on cellular connections. My recommendation is to implement a lightweight GraphQL gateway specifically for mobile client queries.

[03:40] Priya Patel:
From the user experience side, users on slow 4G connections are abandoning the checkout page because the spinner takes over 3.5 seconds. I also completed the initial round of usability testing on the new Figma checkout flow. 8 out of 10 users loved the single-page stepper, but they wanted dynamic pricing breakdowns directly on the payment screen.

[05:20] Sarah Chen:
That makes complete sense. Let's make an official decision right now: we will adopt the GraphQL gateway for mobile endpoints to reduce payload size and minimize client network round-trips. Alex, can you take ownership of that transition?

[06:05] Alex Rodriguez:
Yes, absolutely. I will optimize the database indexing queries for checkout paths by Friday, November 13th, and I will set up the initial GraphQL schema scaffold.

[07:10] Sarah Chen:
Now regarding the localization proposal: marketing asked if we can support German, Spanish, and French in this release. However, engineering estimates indicate localization will add at least 3 weeks of regression testing. Given our target release date, I propose we formally decide to postpone multi-language localization to Q4 so we can prioritize checkout optimization. Are we all in agreement?

[08:25] Alex Rodriguez:
Agreed. We need to stabilize performance first.

[08:35] Priya Patel:
Agreed. I will finalize the high-fidelity Figma wireframes for the dynamic pricing components by November 17th.

[09:10] Sarah Chen:
Great. Two more critical items before we wrap up:
Someone should prepare the presentation for the stakeholder review. We need the roadmap slides ready for the executive steering committee.

[09:55] Alex Rodriguez:
Also, Alex and Priya need to finish the API schema documentation soon so the mobile team can unblock their integration work.

[10:30] Sarah Chen:
Perfect. Let's reconvene on Thursday for a quick standup. Thank you everyone!`
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_MEETING };
}
