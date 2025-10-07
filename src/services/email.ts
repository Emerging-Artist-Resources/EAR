export const emailService = {
  async sendTransactional(to: string, template: string, variables: Record<string, string>) {
    // TODO: Integrate with provider (e.g., Postmark)
    return { id: 'stub', to, template, variables }
  },
}
