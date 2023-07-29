describe('Hacker Stories', () => {
  const initialTerm = 'React'
  const newTerm = 'Cypress'

  context('Hitting the real API', () => {
    beforeEach(() => {
      cy.intercept({ // função de intercepção para request **/search?query=React&page=0
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '0'
        }
      }).as('getStories') // alias da função

      cy.visit('/')
      cy.wait('@getStories') // função que espera a request ALIAS finalizar
    })

    it('shows 20 stories, then the next 20 after clicking "More"', () => {
      cy.intercept({ // função de intercepção para request **/search?query=React&page=1
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '1'
        }
      }).as('getNextStories') // alias da função

      cy.get('.item').should('have.length', 20)

      cy.contains('More').click()
      cy.wait('@getNextStories')  // função que espera a request ALIAS finalizar

      cy.get('.item').should('have.length', 40)
    })

    it('searches via the last searched term', () => {
      cy.intercept( // função de intercepção para request **/search?query***
        'GET',
        `**/search?query=${newTerm}&page=0`
      ).as('getNewTermStories') // alias da função

      cy.get('#search')
        .clear()
        .type(`${newTerm}{enter}`)

      cy.wait('@getNewTermStories')  // função que espera a request ALIAS finalizar

      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
        .click()

      cy.wait('@getStories')  // função que espera a request ALIAS finalizar

      cy.get('.item')
        .should('have.length', 20)
      cy.get('.item')
        .first()
        .should('contain', initialTerm)
      cy.get(`button:contains(${newTerm})`)
        .should('be.visible')
    })
  })

  context('Moking the API', () => {
    context('Footer and list of stories', () => {
      beforeEach(() => {
        cy.intercept(
          'GET',
          `**/search?query=${initialTerm}&page=0`,
          { fixture: 'stories' }
        ).as('getStories') // alias da função

        cy.visit('/')
        cy.wait('@getStories') // função que espera a request ALIAS finalizar
      })

      it('shows the footer', () => {
        cy.get('footer')
          .should('be.visible')
          .and('contain', 'Icons made by Freepik from www.flaticon.com')
      })

      context('List of stories', () => {
        it('shows the right data for all rendered stories', () => {
          const stories = require('../fixtures/stories.json')

          cy.get('.item')
            .first()
            .should('contain', stories.hits[0].title)
            .and('contain', stories.hits[0].author)
            .and('contain', stories.hits[0].num_comments)
            .and('contain', stories.hits[0].points)

          cy.get('.item')
            .last()
            .should('contain', stories.hits[1].title)
            .and('contain', stories.hits[1].author)
            .and('contain', stories.hits[1].num_comments)
            .and('contain', stories.hits[1].points)
        })

        it('shows one less story after dimissing the first one', () => {
          cy.get('.button-small')
            .first()
            .click()

          cy.get('.item').should('have.length', 1)
        })

        context.skip('Order by', () => {
          it('orders by title', () => { })

          it('orders by author', () => { })

          it('orders by comments', () => { })

          it('orders by points', () => { })
        })
      })
    })

    context('Search', () => {
      beforeEach(() => {
        cy.intercept( // função de intercepção para request **/search?query***
          'GET',
          `**/search?query=${initialTerm}&page=0`,
          { fixture: 'empty' }
        ).as('getEmptyStories') // alias da função

        cy.intercept( // função de intercepção para request **/search?query***
          'GET',
          `**/search?query=${newTerm}&page=0`,
          { fixture: 'stories' }
        ).as('getStories') // alias da função

        cy.visit('/')
        cy.wait('@getEmptyStories')

        cy.get('#search')
          .clear()
      })

      it('types and hits ENTER', () => {
        cy.get('#search')
          .type(`${newTerm}{enter}`)

        cy.wait('@getStories')  // função que espera a request ALIAS finalizar

        cy.get('.item').should('have.length', 2)
        cy.get(`button:contains(${initialTerm})`)
          .should('be.visible')
      })

      it('types and clicks the submit button', () => {
        cy.get('#search')
          .type(newTerm)
        cy.contains('Submit')
          .click()

        cy.wait('@getStories')  // função que espera a request ALIAS finalizar

        cy.get('.item').should('have.length', 2)
        cy.get(`button:contains(${initialTerm})`)
          .should('be.visible')
      })

      context('Last searches', () => {
        it('shows a max of 5 buttons for the last searched terms', () => {
          const faker = require('faker')

          cy.intercept( // função de intercepção para request **/search**
            'GET',
            '**/search**',
            { fixture: 'empty' }
          ).as('getRandomStories')  // alias da função

          Cypress._.times(6, () => {
            cy.get('#search')
              .clear()
              .type(`${faker.random.word()}{enter}`)
            cy.wait('@getRandomStories')  // função que espera a request ALIAS finalizar
          })

          cy.get('.last-searches button')
            .should('have.length', 5)
        })
      })
    })
  })
})

context('Errors', () => {
  it('shows "Something went wrong ..." in case of a server error', () => {
    cy.intercept(
      'GET',
      '**/search**',
      { statusCode: 500 } // forçando uma falha no SERVER como 500
    ).as('getServerFailure')

    cy.visit('/')
    cy.wait('@getServerFailure')

    cy.get('p:contains(Something went wrong ...)')
      .should('be.visible')
  })

  it('shows "Something went wrong ..." in case of a network error', () => {
    cy.intercept(
      'GET',
      '**/search**',
      { forceNetworkError: true }  // forçando uma falha na REDE
    ).as('getNetworkFaulire')

    cy.visit('/')
    cy.wait('@getNetworkFaulire')

    cy.get('p:contains(Something went wrong ...)')
      .should('be.visible')
  })
})
