import type {LinkProps} from 'sentry/components/links/link';
import {t} from 'sentry/locale';
import type {Project} from 'sentry/types';
import {DisplayModes} from 'sentry/utils/discover/types';
import {fieldToMri, getDdmUrl, MetricDisplayType} from 'sentry/utils/metrics';
import type {TimePeriodType} from 'sentry/views/alerts/rules/metric/details/constants';
import type {MetricRule} from 'sentry/views/alerts/rules/metric/types';
import {isCustomMetricAggregate} from 'sentry/views/alerts/rules/metric/utils/isCustomMetricAggregate';
import {getMetricRuleDiscoverUrl} from 'sentry/views/alerts/utils/getMetricRuleDiscoverUrl';

interface PresetCta {
  /**
   * The CTA text
   */
  buttonText: string;
  /**
   * The location to direct to upon clicking the CTA.
   */
  to: LinkProps['to'];
}

interface PresetCtaOpts {
  orgSlug: string;
  projects: Project[];
  timePeriod: TimePeriodType;
  query?: string;
  rule?: MetricRule;
}

/**
 * Get the CTA used for alert rules that do not have a preset
 */
export function makeDefaultCta({
  orgSlug,
  projects,
  rule,
  timePeriod,
  query,
}: PresetCtaOpts): PresetCta {
  if (!rule) {
    return {
      buttonText: t('Open in Discover'),
      to: '',
    };
  }

  if (isCustomMetricAggregate(rule.aggregate)) {
    const {mri, op} = fieldToMri(rule.aggregate);
    return {
      buttonText: t('Open in DDM'),
      to: getDdmUrl(orgSlug, {
        start: timePeriod.start,
        end: timePeriod.end,
        utc: timePeriod.utc,
        // 7 days are 9999m in alerts as of a rounding error in the `events-stats` endpoint
        // We need to round to 7d here to display it correctly in DDM
        statsPeriod: timePeriod.period === '9999m' ? '7d' : timePeriod.period,
        project: projects
          .filter(({slug}) => rule.projects.includes(slug))
          .map(project => project.id),
        environment: rule.environment ? [rule.environment] : [],
        widgets: [
          {
            mri: mri as string,
            op: op as string,
            query: rule.query,
            displayType: MetricDisplayType.AREA,
          },
        ],
      }),
    };
  }

  const extraQueryParams = {
    display: DisplayModes.TOP5,
  };

  return {
    buttonText: t('Open in Discover'),
    to: getMetricRuleDiscoverUrl({
      orgSlug,
      projects,
      rule,
      timePeriod,
      query,
      extraQueryParams,
    }),
  };
}
