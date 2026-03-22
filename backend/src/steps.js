/**
 * The ordered list of steps every release goes through.
 * Stored as keys in the `steps_completed` JSONB column.
 */
const STEPS = [
  { key: 'prs_merged',        label: 'All relevant GitHub pull requests have been merged' },
  { key: 'changelog_updated', label: 'CHANGELOG.md files have been updated' },
  { key: 'tests_passing',     label: 'All tests are passing' },
  { key: 'github_release',    label: 'Release created on GitHub' },
  { key: 'deployed_demo',     label: 'Deployed in demo environment' },
  { key: 'tested_demo',       label: 'Tested thoroughly in demo' },
  { key: 'deployed_prod',     label: 'Deployed in production' },
  { key: 'docs_updated',      label: 'Documentation updated' },
  { key: 'stakeholders_notified', label: 'Stakeholders notified' },
  { key: 'monitoring_set',    label: 'Post-release monitoring confirmed' },
];

/**
 * Derive status from a steps_completed map.
 * @param {Object} stepsCompleted  e.g. { prs_merged: true, ... }
 * @returns {'planned'|'ongoing'|'done'}
 */
const computeStatus = (stepsCompleted = {}) => {
  const completed = STEPS.filter(s => stepsCompleted[s.key] === true).length;
  if (completed === 0)            return 'planned';
  if (completed === STEPS.length) return 'done';
  return 'ongoing';
};

module.exports = { STEPS, computeStatus };
