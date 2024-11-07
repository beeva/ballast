export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Ballast",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      "A deployment and observability control plane: a real build runner, deploy/rollback on build history, metrics and threshold alerting, and a cost estimator.",
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
