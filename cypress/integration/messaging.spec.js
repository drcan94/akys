describe('Messaging System', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/dashboard/messages');
  });

  it('displays channel list and allows channel selection', () => {
    cy.get('[data-testid="channel-list"]').should('be.visible');
    cy.get('[data-testid="channel-item"]').first().click();
    cy.get('[data-testid="message-area"]').should('be.visible');
  });

  it('sends and receives messages', () => {
    cy.get('[data-testid="channel-item"]').first().click();
    
    // Send message
    cy.get('[data-testid="message-input"]')
      .type('Test message{enter}');
    
    // Verify message appears
    cy.get('[data-testid="message-item"]')
      .last()
      .should('contain', 'Test message');
    
    // Verify real-time update in another session
    cy.task('loginAsOtherUser');
    cy.get('[data-testid="message-item"]')
      .last()
      .should('contain', 'Test message');
  });

  it('handles message reactions', () => {
    cy.get('[data-testid="channel-item"]').first().click();
    
    // Add reaction
    cy.get('[data-testid="message-item"]')
      .first()
      .find('[data-testid="reaction-button"]')
      .click();
    
    cy.get('[data-testid="reaction-picker"]')
      .should('be.visible')
      .contains('👍')
      .click();
    
    // Verify reaction appears
    cy.get('[data-testid="message-item"]')
      .first()
      .find('[data-testid="reaction-count"]')
      .should('contain', '1');
  });

  it('shows typing indicators', () => {
    cy.get('[data-testid="channel-item"]').first().click();
    
    // Simulate typing in another session
    cy.task('simulateTyping', {
      channelId: 'test-channel',
      userId: 'other-user',
      userName: 'Other User',
    });
    
    // Verify typing indicator
    cy.contains('Other User yazıyor...').should('be.visible');
  });

  it('loads message history with infinite scroll', () => {
    cy.get('[data-testid="channel-item"]').first().click();
    
    // Initial messages
    cy.get('[data-testid="message-item"]').should('have.length', 50);
    
    // Scroll to top to load more
    cy.get('[data-testid="message-list"]').scrollTo('top');
    
    // Verify more messages loaded
    cy.get('[data-testid="message-item"]').should('have.length', 100);
  });

  it('handles mentions and notifications', () => {
    cy.get('[data-testid="channel-item"]').first().click();
    
    // Type @ to trigger mention
    cy.get('[data-testid="message-input"]').type('@');
    
    // Select user from mention list
    cy.get('[data-testid="mention-list"]')
      .should('be.visible')
      .contains('Other User')
      .click();
    
    // Complete and send message
    cy.get('[data-testid="message-input"]')
      .type(' hello{enter}');
    
    // Verify mention appears
    cy.get('[data-testid="message-item"]')
      .last()
      .should('contain', '@Other User');
    
    // Verify notification in other session
    cy.task('loginAsOtherUser');
    cy.get('[data-testid="notification-badge"]').should('have.text', '1');
  });

  it('enforces channel permissions', () => {
    // Try to access restricted channel
    cy.visit('/dashboard/messages?channel=restricted-channel');
    cy.contains('Bu kanala erişim yetkiniz yok').should('be.visible');
  });

  it('handles file attachments', () => {
    cy.get('[data-testid="channel-item"]').first().click();
    
    // Upload file
    cy.get('[data-testid="file-input"]')
      .attachFile('test.pdf');
    
    // Verify file appears
    cy.get('[data-testid="message-item"]')
      .last()
      .find('[data-testid="file-attachment"]')
      .should('contain', 'test.pdf');
  });

  it('supports message search', () => {
    cy.get('[data-testid="channel-item"]').first().click();
    
    // Search for message
    cy.get('[data-testid="search-input"]')
      .type('specific message{enter}');
    
    // Verify search results
    cy.get('[data-testid="message-item"]')
      .should('have.length.gt', 0)
      .and('contain', 'specific message');
  });
});