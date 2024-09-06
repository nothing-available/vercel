const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');


const app = express();

const PORT = 9000;

const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: 'AKIA5FCD57QB7VGGVCBC',
        secretAccessKey: '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'
    }
});

const config = {
    CLUSTER: 'arn:aws:ecs:ap-south-1:904233090051:cluster/vercel-cluster',
    TASK: 'arn:aws:ecs:ap-south-1:904233090051:cluster/vercel-cluster'
};


app.use(express.json());

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug ? slug : generateSlug();

    // Spin the container
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: ['subnet-089a90c70b22a1422', 'subnet-07eef60d1aea5cf55', 'subnet-08a5b0bd9f4ae008d'],
                securityGroups: ['sg-0fbed15904ca19591']
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'vercel-image',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: gitURL },
                        { name: 'PROJECT_ID', value: projectSlug }
                    ]
                }
            ]
        }
    });
    await ecsClient.send(command);

    return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } });

});

app.listen(PORT, () => console.log(`API Server Running..${PORT}`));