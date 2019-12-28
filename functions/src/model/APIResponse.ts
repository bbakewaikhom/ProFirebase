export class APIResponse {
    private status: string;
    private message: string;
    private response: string;

    public getAPIResponse (): string {
        const apiResponse: APIResponse = new APIResponse()
        apiResponse.setStatus(this.status)
        apiResponse.setMessage(this.message)
        apiResponse.setResponse(this.response)

        return JSON.stringify(apiResponse)
    }

    public setStatus (status: string) {
        this.status = status
    }
    
    public setMessage (message: string) {
        this.message = message
    }
    
    public setResponse (response: string) {
        this.response = response
    }

    public getStatus (): string {
        return this.status
    }
    
    public getMessage (): string {
        return this.message
    }
    
    public getResponse (): string {
        return this.response
    }
}