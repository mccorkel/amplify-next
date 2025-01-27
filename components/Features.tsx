"use client";

export default function Features() {
  return (
    <section id="features" className="my-16">
      <h2 className="mb-4 text-3xl font-bold dark:text-sidebar-foreground">
        Awesome Features
      </h2>
      <p className="mb-8 text-gray-600 dark:text-muted-foreground">
        Explore some highlights below:
      </p>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-card p-6 shadow dark:shadow-none">
          <h3 className="mb-2 text-xl font-semibold dark:text-foreground">Feature One</h3>
          <p className="text-sm text-muted-foreground">Description of the first feature.</p>
        </div>
        <div className="rounded-lg bg-card p-6 shadow dark:shadow-none">
          <h3 className="mb-2 text-xl font-semibold dark:text-foreground">Feature Two</h3>
          <p className="text-sm text-muted-foreground">Description of the second feature.</p>
        </div>
        <div className="rounded-lg bg-card p-6 shadow dark:shadow-none">
          <h3 className="mb-2 text-xl font-semibold dark:text-foreground">Feature Three</h3>
          <p className="text-sm text-muted-foreground">Description of the third feature.</p>
        </div>
      </div>
    </section>
  );
}