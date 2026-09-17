def generate_customer_reply(customer_name: str | None, tone: str) -> str:
    greeting = f"Hi {customer_name}, " if customer_name else "Hello, "
    if tone == "friendly":
        return greeting + "thank you for reaching out. We’re happy to help and will work to resolve this as quickly as possible."
    if tone == "concise":
        return greeting + "thank you for contacting us. We’re reviewing your request and will update you shortly."
    return greeting + "thank you for contacting us. We understand your concern and are reviewing the details. We’ll assist you with the next steps as soon as possible."
