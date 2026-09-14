export type SendSmsPayload = {
  recipients: string[];
  message: string;
};

export const sendSms = async ({
  recipients,
  message,
}: SendSmsPayload): Promise<unknown> => {
  try {
    const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.ARKESEL_API_KEY as string,
      },
      body: JSON.stringify({
        sender: "Troski",
        message: message,
        recipients: recipients,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Arkesel API Error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("SMS sent successfully!", data);
    return data;
  } catch (error) {
    console.error("SMS configuration exception:", error);
    return null;
  }
};
