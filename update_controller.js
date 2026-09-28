const fs = require('fs');
let code = fs.readFileSync('apps/api/src/modules/tickets/tickets.controller.ts', 'utf8');

code = code.replace(/async getTickets\(@CurrentUser\(\) user: any\) \{[\s\S]*?return this.ticketsService.getTickets\(user.id\);\n  \}/, `async getTickets(@CurrentUser() user: any) {
    return this.ticketsService.getTickets(user);
  }`);

code = code.replace(/async getTicket\(@CurrentUser\(\) user: any, @Param\('id'\) id: string\) \{[\s\S]*?return this.ticketsService.getTicket\(id, user.id, user.role === 'super_admin'\);\n  \}/, `async getTicket(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ticketsService.getTicket(id, user);
  }`);

code = code.replace(/async replyToTicket\(@CurrentUser\(\) user: any, @Param\('id'\) id: string, @Body\(\) dto: ReplyTicketDto\) \{[\s\S]*?return this.ticketsService.replyToTicket\(id, user.id, dto, user.role === 'super_admin'\);\n  \}/, `async replyToTicket(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ReplyTicketDto) {
    return this.ticketsService.replyToTicket(id, user, dto);
  }`);

code = code.replace(/@Patch\(':id\/status'\)\n  @Roles\('super_admin'\)\n  @ApiOperation\(\{ summary: 'Update ticket status \(Admin only\)' \}\)\n  async updateStatus\(@Param\('id'\) id: string, @Body\(\) dto: UpdateTicketStatusDto\) \{[\s\S]*?return this.ticketsService.updateStatus\(id, dto\);\n  \}/, `@Patch(':id/status')
  @Roles('super_admin', 'reseller')
  @ApiOperation({ summary: 'Update ticket status (Admin or Reseller)' })
  async updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.ticketsService.updateStatus(id, user, dto);
  }`);

fs.writeFileSync('apps/api/src/modules/tickets/tickets.controller.ts', code);
