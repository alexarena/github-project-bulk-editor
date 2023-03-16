import { Action, ctx, io } from "@interval/sdk";
import GitHubProject from "github-project";

if (!process.env.GITHUB_TOKEN) {
  console.log(
    `Error! process.env.GITHUB_TOKEN must be set. You can get a GitHub personal access token at: https://github.com/settings/tokens`
  );
  process.exit(1);
}
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default new Action({
  name: "Bulk project editor",
  handler: async () => {
    const owner = await io.input.text("Owner", {
      placeholder: "alexarena",
      helpText: `This is the GitHub account username that owns the project.`,
    });
    const projectNumber = await io.input.number("Project number", {
      placeholder: "1",
      helpText: `Each GitHub project has a number. You can get the number by looking at the URL of the project. For example the project at https://github.com/users/alexarena/projects/1 has the number "1"`,
      min: 0,
    });

    const customFieldName = await io.input.text("Custom field to bulk edit", {
      helpText: `This is name of the custom field you want to edit.`,
    });

    const project = new GitHubProject({
      owner,
      number: projectNumber,
      token: GITHUB_TOKEN,
      fields: {
        customField: customFieldName,
      },
    });

    const projectData = await project.getProperties();

    const allItems = await project.items.list();

    // format the data nicely for our table
    const tableData = allItems.map(({ id, content, fields }) => {
      return {
        id,
        title: "title" in content ? content.title : null,
        createdAt: "createdAt" in content ? new Date(content.createdAt) : null,
        [customFieldName]: fields.customField,
      };
    });

    const selectedItems = await io.select.table(
      `Choose items to bulk edit for ${projectData.title}`,
      {
        data: tableData,
      }
    );

    const newValue = await io.input.text(`New value for ${customFieldName}`, {
      helpText: `${customFieldName} for ${selectedItems.length} items will be updated to this value.`,
    });

    const isConfirmed = await io.confirm(
      `Are you sure you want to update ${selectedItems.length} items?`
    );

    if (!isConfirmed) {
      return;
    }

    await ctx.loading.start({
      label: "Updating items...",
      itemsInQueue: selectedItems.length,
    });

    for (const item of selectedItems) {
      await project.items.update(item.id, {
        customField: newValue,
      });
      await ctx.loading.completeOne();
    }
  },
});
