import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { H3, H4, Text } from "@/components/ui/typography";

export const MyOverview = () => {
    return (
        <>
        <H3 className="mb-3">Activity Overview</H3>
        <Card border="dashed" padding="md">
          <div className="space-y-3">
            <OverviewRow
              title="Events Saved"
              description="Events bookmarked for later"
              count={0}
              colorClass="bg-cyan-50"
            />
            <OverviewRow
              title="Listings Submitted"
              description="Listings you submitted for review"
              count={0}
              colorClass="bg-green-50"
            />
            <OverviewRow
              title="Applications Submitted"
              description="Funding and opportunity applications"
              count={0}
              colorClass="bg-purple-50"
            />
            <OverviewRow
              title="Events Attended"
              description="Events you’ve participated in"
              count={0}
              colorClass="bg-orange-50"
            />
          </div>
        </Card>
      </>
    )
}

function OverviewRow({
    title,
    description,
    count,
    colorClass,
  }: {
    title: string
    description: string
    count: number
    colorClass?: string
  }) {
    return (
      <div className={`flex items-center justify-between rounded-md px-4 py-3 ${colorClass ?? "bg-gray-50"}`}>
        <div>
          <H4>{title}</H4>
          <Text className="text-sm text-gray-600">{description}</Text>
        </div>
        <Badge variant="primary">{count}</Badge>
      </div>
    )
  }