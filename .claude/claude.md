# MyLEI App Development Guide for AI SWE Agents
This is a NextJS 15 app, using Tailwind for CSS, ShadCN for UI, supabase for DB.

## Initial Setup (already done)
pnpm was configured as the package manager

## Commands useful in development
dip bundle add <gem_name> installs a new Ruby gem.
dip pnpm install <package_name> installs a new JS package. You should aim to use only high-quality gems/packages.
dip rails generate migration <MigrationName> creates a Rails migration file which you can then edit. Consult other migration files for best practices.
Nearly all changes you make, including to CSS, will result in a hot reload of the web app. However, if you make changes in the config/ directory, then you will need to run dip overmind restart, which is the only way to restart the web app.

Linting and formatting
Human devs have IDEs that autoformat code on every file save. After you edit files, you must do the equivalent by running dip autoformat.

This command will also report linter errors that were not automatically fixable. Use your judgement as to which of the linter violations should be fixed.

Testing
Non-system tests (fast): dip test or dip test test/<path>.rb
System tests (slower): dip test system or dip test system test/system/<path>.rb
All of the non-system and system tests (slow): dip test all
Interacting with the app
The only way to interact with our web app is via the browser, at the URL given by bin/echo-app-url. Using the browser to test functionality is an important part of your work.

You can use the Playwright MCP to sign in (see db/seeds/development.rb), and take screenshots so that you can test the functionality you develop. Use the browser_take_screenshot, not the browser_snapshot tool.

You should use a subagent for all app interaction tasks.

Debugging
You can view the web app logs at log/development.log (use a subagent to tail at least 200 lines and return the relevant lines)
If using the Playwright MCP, you can use the browser_console_messages tool (use a subagent to return the relevant lines)
You can run code in the Rails console, either directly (e.g. dip rails runner "puts Ticket.count") or by first writing out a script file (e.g. dip rails runner script/print_ticket_count.rb).
Patterns
Most AI functionality is in our own library called Agentic, located in lib/agentic. The Agentic library defines a number of Agents, such as SendMessage in send_message.rb The associated test for SendMessage is in send_message_test.rb

The Agentic library tries to be app-agnostic, such that it could be used in any Rails app. Any kind of side effects that are specific to this app are handled by the Adapter pattern. For example, executing the SendMessage creates a RichMessage record in the database, which is handled by the Agentic::Adapters::Ticket::SendMessage adapter in send_message.rb

Some main points of interest for our app business logic:

ticket_implementation.rb defines the TicketImplementation model, which has an AgentOrchestration
agent_orchestration.rb creates and updates AgentExecutions that track the progress of Agentic agents. It also has a Conversation
conversation.rb handles the messages which are sent between the user(s) and assistants
Some other representative files that show the best patterns to follow:

tickets_controller.rb is the main controller for Tickets
ticket_query.rb is a query object that defines complex queries on the Ticket model
show.html.slim is the main page for a Ticket
conversation_controller.js is a Stimulus controller that scrolls to the last message in the conversation
We have our own interface to LLM providers, llm.rb

We use concerns for shared behaviors (e.g., has_public_id, agentable).

We use Font Awesome v6, and new icons must be added to config/initializers/icons.rb.

If you have any issues with icon names, first make sure that the name of the icon is a valid v6 name (consult this list of renamed icons).

We value code that explains itself through clear class, method, and variable names. Comments may be used when necessary to explain some tricky logic, but should otherwise be avoided.