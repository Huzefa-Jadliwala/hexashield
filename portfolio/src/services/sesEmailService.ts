import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize the SES client
const sesClient = new SESClient({
    region: import.meta.env.VITE_AWS_REGION as string,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID as string,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY as string,
    },
});

export const sendEmail = async (
    toEmail: string,
    subject: string,
    message: string
): Promise<void> => {
    const params = {
        Source: 'hafiz.tu.chemnitz@gmail.com', // Must be a verified email address
        Destination: {
            ToAddresses: [toEmail],
        },
        Message: {
            Body: {
                Text: { Data: message },
            },
            Subject: { Data: subject },
        },
    };

    try {
        const command = new SendEmailCommand(params);
        const response = await sesClient.send(command);
        console.log("response", response)
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email', error);
        throw new Error('Failed to send email');
    }
};
